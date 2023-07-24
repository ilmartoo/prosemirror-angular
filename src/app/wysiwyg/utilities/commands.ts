/**
 * Custom ProseMirror custom functions
 */

import {Command, EditorState, TextSelection, Transaction} from 'prosemirror-state';
import {Attrs, Fragment, Mark, MarkType, Node as ProseNode, NodeRange, NodeType} from 'prosemirror-model';
import {INDENT_LEVEL_STEP, MARK_TYPES, NODE_TYPES} from '../text-editor/custom-schema';
import {
  chainCommands,
  createParagraphNear,
  exitCode,
  liftEmptyBlock,
  newlineInCode,
  splitBlock,
  wrapIn
} from 'prosemirror-commands';
import {canJoin, findWrapping} from 'prosemirror-transform';
import {extendTransaction} from "./transactions-helper";
import {
  ancestorAt,
  areNodeTypesEquals,
  ExtendedNode,
  findAllAncestors,
  findAncestor,
  findAncestorOfType,
  isListNode
} from "./nodes-helper";
import {expandMarkActiveRange, expandMarkTypeActiveRange} from './marks-helper';
import {createTable} from './table-helper';
import {isValidContent} from './node-content-helper';
import {wrapInList} from 'prosemirror-schema-list';

/**
 * Selects the text of the given range
 * @param from Start of the range
 * @param to End of the range
 * @returns Command to select the text between the given positions
 */
export function selectRange(from: number, to: number): Command {
  if (from > to) {
    return selectRange(to, from);
  }

  return function (state: EditorState, dispatch?: (tr: Transaction) => void): boolean {
    if (dispatch) {
      const tr = state.tr;
      tr.setSelection(TextSelection.create(tr.doc, from, to));
      dispatch(tr.scrollIntoView());
    }
    return true;
  }
}

/**
 * Replaces the text in the given selection with the text provided activating the passed marks.
 * If no end position is passed, the text will be inserted
 * @param text Text to replace
 * @param marks Marks to apply to the selection. Any mark types contained in the array
 *              that are currently active will be removed and replaced with these
 * @param from Start of the range
 * @param to End of the range
 * @param inheritMarks When a selection is passed, if the new text should inherit replaced text's marks
 * @returns Command to replace the text
 */
export function replaceWithMarkedText(text: string, marks: Mark[], from: number, to?: number, inheritMarks = true): Command {
  if (to && from > to) {
    return replaceWithMarkedText(text, marks, to, from);
  }

  return function (state: EditorState, dispatch?: (tr: Transaction) => void): boolean {
    if (dispatch) {
      const tr = state.tr;

      // Replace existing text
      if (to) {
        tr.setSelection(TextSelection.create(tr.doc, from, to));
        marks.forEach(mark => tr.removeMark(from, to, mark.type));
        tr.replaceSelectionWith(state.schema.text(text), inheritMarks);
      }
      // Insert new text
      else {
        marks.forEach(mark => tr.removeStoredMark(mark.type));
        tr.insertText(text, from);
      }
      marks.forEach(mark => tr.addMark(from, tr.selection.to, mark));
      tr.setSelection(TextSelection.create(tr.doc, from, tr.selection.to));

      dispatch(tr.scrollIntoView());
    }
    return true;
  }
}

/**
 * Remove marks from inline nodes between from and to
 * - When mark is a single mark, remove precisely that mark
 * - When it is a mark type, remove all marks of that type
 * - When it is null, remove all marks of any type
 * @param from Start of the selection
 * @param to End of the selection
 * @param marks Array of marks or mark types to remove. All if null or undefined
 * @returns Command to remove the mark, mark type or all marks in the selection
 */
export function removeMarks(from: number, to: number, marks?: (Mark | MarkType)[] | null): Command {
  if (from > to) {
    return removeMarks(to, from, marks);
  }

  return function (state: EditorState, dispatch?: (tr: Transaction) => void): boolean {
    if (dispatch) {
      const tr = state.tr;

      if (marks) {
        marks.forEach(mark => tr.removeMark(from, to, mark));
      }
      else {
        tr.removeMark(from, to);
      }

      dispatch(tr.scrollIntoView());
    }
    return true;
  }
}

/**
 * Expands the selected marks and mark types into individual ranges and removes them from the expanded ranges
 * @param pos Position to start the range expansion
 * @param marks Marks and mark types to expand and remove
 * @returns Command remove the marks and mark types from the expanded ranges
 */
export function expandAndRemoveMarks(pos: number, marks: (Mark | MarkType)[]): Command {
  return function (state: EditorState, dispatch?: (tr: Transaction) => void): boolean {
    if (marks.length === 0) { return false; } // Cancel if no marks to expand

    const expansions: { mark: Mark | MarkType, range: NodeRange }[] = [];

    for (const mark of marks) {
      let range = mark instanceof Mark
        ? expandMarkActiveRange(state.doc, mark, pos)
        : expandMarkTypeActiveRange(state.doc, mark, pos);

      if (range) {
        expansions.push({ mark, range });
      }
    }
    if (expansions.length === 0) { return false; } // Cancel if no expansions are found



    if (dispatch) {
      const tr = state.tr;

      expansions.forEach(exp => tr.removeMark(exp.range.start, exp.range.end, exp.mark));

      dispatch(tr.scrollIntoView());
    }
    return true;
  }
}

/**
 * Inserts content at the given position of the editor
 * @param at Position to insert
 * @param content Content to insert
 * @returns Command to insert the content at the given position
 */
export function insertContent(at: number, content: ProseNode | Fragment | readonly ProseNode[]): Command {
  return function (state: EditorState, dispatch?: (tr: Transaction) => void): boolean {
    const fragment = Fragment.from(content);
    const $at = state.doc.resolve(at);
    // Cancel if content cannot be inserted at the position specified
    if ($at.node().type.validContent(fragment)) { return false; }

    if (dispatch) {
      const tr = state.tr;
      tr.insert(at, fragment);
      dispatch(tr.scrollIntoView());
    }
    return true;
  }
}

/**
 * Creates a table at a specified position
 * @param at Position to insert the table at
 * @param rows Number of rows of the table
 * @param cols Number of columns of the table
 * @returns Command to insert a table with the given dimensions at the specified position of the document
 */
export function insertTable(at: number, rows: number, cols: number): Command {
  return function (state: EditorState, dispatch?: (tr: Transaction) => void): boolean {
    if (rows < 1 || cols < 1) { return false; } // Cancel if dimensions of the table are not valid

    const table = createTable(rows, cols);
    return insertContent(at, table)(state, dispatch);
  }
}

/**
 * Changes the parent element's list type from the current cursor position to the one specified
 * @param listType New list node type
 * @param attrs Attrs for the new list node
 * @returns Command to change the parent list type
 */
export function changeListType(listType: NodeType, attrs?: Attrs | null): Command {
  return function (state: EditorState, dispatch?: (tr: Transaction) => void): boolean {
    const {$head} = state.selection;

    const isDifferentListType = (node: ProseNode): boolean =>
      isListNode(node) && areNodeTypesEquals(node.type, listType) && isValidContent(listType, node.content);
    const listNode = findAncestor($head, isDifferentListType);
    if (!listNode) { return false; } // Cancel if no different list type with compatible content is found

    if (dispatch) {
      const tr = state.tr;

      const $anchor = state.selection.$anchor;
      const from = listNode.before;
      const to = listNode.nodeSize + listNode.before;
      const newList = listType.create(attrs, listNode.content);

      tr.replaceWith(from, to, newList);
      tr.setSelection(new TextSelection(tr.doc.resolve($anchor.pos), tr.doc.resolve($head.pos)));

      dispatch(tr.scrollIntoView());
    }
    return true;
  }
}

/**
 * Increases indent on selected area
 * @param state State of the editor
 * @param dispatch Dispatch function
 * @returns False if the command cannot be executed
 */
export const increaseBlockIndent: Command = (state: EditorState, dispatch?: (tr: Transaction) => void): boolean => {
  const {$head , $anchor} = state.selection;
  let range = $head.blockRange($anchor);
  if (!range) { return false; }

  let wrapping = findWrapping(range, NODE_TYPES.indent);
  if (!wrapping) {
    const isIndentable = (node: ProseNode) => isValidContent(NODE_TYPES.indent, node);
    const indentableNode = findAncestor(range.$from, isIndentable, range.depth);

    // Cancel if no parent indentable node is found
    if (!indentableNode) { return false; }

    const $from = state.doc.resolve(indentableNode.before);
    const $to = state.doc.resolve(indentableNode.after);
    range = new NodeRange($from, $to, indentableNode.depth);
    wrapping = findWrapping(range, NODE_TYPES.indent);
  }

  // Cancel if no valid wrapping parent node is found
  if (!wrapping) { return false; }

  if (dispatch) {
    const tr = extendTransaction(state.tr);

    const parent = ancestorAt(range.$from, range.depth);
    const isParentIndentNode = areNodeTypesEquals(parent.type, NODE_TYPES.indent)

    // Update indent level if is already wrapped and is the only content of the indentation
    if (isParentIndentNode && parent.content.size === range.end - range.start) {
      const updatedLevel = parent.attrs['level'] + INDENT_LEVEL_STEP;
      tr.setNodeAttribute(parent.before, 'level',  updatedLevel);
    }
    // Wrap in new indent otherwise
    else {
      tr.wrap(range, wrapping);
      tr.mapAndSelect($anchor.pos, $head.pos);
    }

    dispatch(tr.scrollIntoView());
  }
  return true;
}

/**
 * Decreases indent on selected area
 * @param state State of the editor
 * @param dispatch Dispatch function
 * @returns False if the command cannot be executed
 */
export const decreaseBlockIndent: Command = (state: EditorState, dispatch?: (tr: Transaction) => void): boolean => {
  const {$head, $anchor} = state.selection;
  const range = $head.blockRange($anchor);
  if (!range) { return false; }

  const indentNode = findAncestorOfType(range.$from, NODE_TYPES.indent);
  if (!indentNode) { return false; }

  const updatedLevel = indentNode.attrs['level'] - INDENT_LEVEL_STEP;
  const isUnwrapNeeded = updatedLevel <= 0;

  // Only if unwrap is needed
  if (isUnwrapNeeded) {
    const wrapperParent = range.$from.node(indentNode.depth - 1);
    const isUnwrappable = isValidContent(wrapperParent.type, indentNode.content);
    if (!isUnwrappable) { return false; } // Node cannot be unwrapped
  }

  if (dispatch) {
    const tr = extendTransaction(state.tr);

    if (isUnwrapNeeded) {
      tr.unwrapNode(indentNode);
    }
    else {
      tr.setNodeAttribute(indentNode.before, 'level',  updatedLevel);
    }

    dispatch(tr.scrollIntoView());
  }
  return true;
}

/**
 * Increases the indent of the selected list item node content
 * @param state State of the editor
 * @param dispatch Dispatch function
 * @returns False if the command cannot be executed
 */
export const increaseListIndent: Command = (state: EditorState, dispatch?: (tr: Transaction) => void): boolean => {
  const {$anchor, $head} = state.selection;
  let range = $anchor.blockRange($head);
  if (!range) { return false; }

  const isListItem = (node?: ProseNode | null) => areNodeTypesEquals(node?.type, NODE_TYPES.list_item);

  const rangeParent = ancestorAt(range.$from, range.depth);
  let listNode: ExtendedNode;

  let from: number;
  let to: number;

  let selectedFirstChild = false;
  let selectedAllContent = false;

  // Selected a list item or a subsection of it
  if (isListItem(rangeParent)) {
    listNode = ancestorAt(range.$from, range.depth - 1);

    from = range.$from.before(range.depth); // Set from just before list_item open tag
    to = range.$from.after(range.depth);    // Set to just after list_item close tag

    selectedFirstChild = rangeParent === listNode.firstChild;
  }
  // Selected multiple list items
  else if (isListItem(rangeParent.firstChild)) {
    listNode = rangeParent;

    from = range.$from.before(range.depth + 1); // Set from just before first selected list_item open tag
    to = range.$to.after(range.depth + 1);      // Set to just after last selected list_item close tag

    selectedFirstChild = listNode.start === from;
    selectedAllContent =  listNode.content.size === to - from;
  }
  // Cancel if no list is detected
  else { return false; }

  // Cancel if first list item is selected or all list content is selected
  if (selectedFirstChild || selectedAllContent) { return true; }

  const $from = state.doc.resolve(from);
  const $to = state.doc.resolve(to);
  range = new NodeRange($from, $to, range.depth - 1);
  const wrapping = findWrapping(range, listNode.type);
  if (!wrapping) { return false; } // Cancel if no wrapping is found

  if (dispatch) {
    const tr = extendTransaction(state.tr);

    tr.wrap(range, wrapping);
    if (canJoin(tr.doc, $from.pos)) {
      tr.join($from.pos);
    }
    tr.mapAndSelect($anchor.pos, $head.pos);

    dispatch(tr.scrollIntoView());
  }
  return true;
}

/**
 * Decreases the indent of the selected list item node content
 * @param state State of the editor
 * @param dispatch Dispatch function
 * @returns False if the command cannot be executed
 */
export const decreaseListIndent: Command = (state: EditorState, dispatch?: (tr: Transaction) => void): boolean => {
  const {$anchor, $head} = state.selection;
  let range = $anchor.blockRange($head);
  if (!range) { return false; }

  const listNodes = findAllAncestors(range.$from, isListNode, range.depth);
  if (listNodes.length < 2) { return false; } // Cancel if list does not have a parent list wrapping it

  if (dispatch) {
    const tr = extendTransaction(state.tr);

    const listToUnwrap = listNodes[0];
    tr.unwrapNode(listToUnwrap);

    dispatch(tr.scrollIntoView());
  }
  return true;
}

/**
 * Command chain of:
 * - increaseListIndent
 * - increaseBlockIndent
 * @returns False if command cannot be executed
 */
export const increaseIndent: Command = chainCommands(increaseListIndent, increaseBlockIndent);

/**
 * Command chain of:
 * - decreaseListIndent
 * - decreaseBlockIndent
 * @returns False if command cannot be executed
 */
export const decreaseIndent: Command = chainCommands(decreaseListIndent, decreaseBlockIndent);

/**
 * Replaces a selection in a list node with a new list item
 * @param state State of the editor
 * @param dispatch Dispatch function
 * @returns False if the command cannot be executed
 */
export const newListItem: Command = (state: EditorState, dispatch?: (tr: Transaction) => void): boolean => {
  const $from = state.selection.$from;

  const listNodeData = findAncestor($from, isListNode);
  if (!listNodeData) { return false; } // Cancel if list item different from listType exists

  if (dispatch) {
    const tr = state.tr;
    tr.deleteSelection();
    tr.split($from.pos, 2);
    dispatch(tr.scrollIntoView());
  }
  return true;
}

/**
 * Command chain of:
 * - wrapInList
 * - changeListType
 * @param listType List node type to wrap into or change to its type
 * @return Command of the chained commmands
 */
export const listCommands = (listType: NodeType): Command =>
  chainCommands(wrapInList(listType), changeListType(listType));
  // TODO: unwrapList
  // chainCommands(wrapInList(this.type), changeListType(this.type), unwrapList(this.type));

/**
 * Replaces a selection in a node with a new line
 * @param state State of the editor
 * @param dispatch Dispatch function
 * @returns False if the command cannot be executed
 */
export const newLineText: Command = (state: EditorState, dispatch?: (tr: Transaction) => void): boolean => {
  const {$head, $anchor} = state.selection;
  // Cancel if selection is code block or has different parents
  if ($head.parent.type.spec.code || !$head.sameParent($anchor)) { return false; }

  if (dispatch) {
    const tr = state.tr;

    tr.replaceSelectionWith(state.schema.node(NODE_TYPES.hard_break), true);

    dispatch(tr.scrollIntoView());
  }
  return true;
}

/**
 * Command chain of:
 * - exitCode
 * - newLineText
 * @param state State of the editor
 * @param dispatch Dispatch function
 * @returns False if the command cannot be executed
 */
export const newLine: Command = chainCommands(exitCode, newLineText);

/**
 * Command chain of:
 * - newlineInCode
 * - createParagraphNear
 * - liftEmptyBlock
 * - newListItem
 * - splitBlock
 * @param state State of the editor
 * @param dispatch Dispatch function
 * @returns False if the command cannot be executed
 */
export const newBlock: Command = chainCommands(newlineInCode, createParagraphNear, liftEmptyBlock, newListItem, splitBlock);

/**
 * Changes the color mark of the text
 * @param color New color to change into or undefined if the color should be removed
 * @returns False if the command cannot be executed
 */
export function changeTextColor(color?: string): Command {
  return function (state: EditorState, dispatch?: (tr: Transaction) => void): boolean {
    const {$from, $to} = state.selection;
    const range = $from.blockRange($to);
    if (!range) { return false; }

    if (dispatch) {
      const tr = state.tr;

      if (color) {
        tr.addMark($from.pos, $to.pos, MARK_TYPES.color.create({ color }));
      } else {
        tr.removeMark($from.pos, $to.pos, MARK_TYPES.color);
      }

      dispatch(tr.scrollIntoView());
    }
    return true;
  }
}

/**
 * Unwraps the node of the given type at the selection
 * @param type Type of the node to unwrap
 * @returns False if the command cannot be executed
 */
export function unwrapFrom(type: NodeType): Command {
  return function (state: EditorState, dispatch?: (tr: Transaction) => void): boolean {
    const {$from, $to} = state.selection;
    const range = $from.blockRange($to);
    if (!range) { return false; }

    const isWrapperType = (node: ProseNode) => areNodeTypesEquals(node.type, type);
    const wrapper = findAncestor(range.$from, isWrapperType, range.depth);
    if (!wrapper) { return false; } // No wrapper from the given type is found

    const wrapperParent = range.$from.node(wrapper.depth - 1);
    const isUnwrappable = isValidContent(wrapperParent.type, wrapper.content);
    if (!isUnwrappable) { return false; } // Node cannot be unwrapped

    if (dispatch) {
      const tr = extendTransaction(state.tr);

      tr.unwrapNode(wrapper);

      dispatch(tr.scrollIntoView());
    }
    return true;
  }
}

/**
 * Command chain of:
 * - unwrapFrom
 * - wrapIn
 * @param type Type of the node to wrap or unwrap
 * @param attrs Attributes of the wrapping node
 * @returns False if the command cannot be executed
 */
export const toggleWrapper = (type: NodeType, attrs?: Attrs): Command => chainCommands(unwrapFrom(type), wrapIn(type, attrs));
