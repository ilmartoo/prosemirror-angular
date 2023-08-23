/**
 * Custom ProseMirror custom functions
 */

import {Command, EditorState, TextSelection, Transaction} from 'prosemirror-state';
import {Attrs, Fragment, Mark, MarkType, Node as ProseNode, NodeRange, NodeType} from 'prosemirror-model';
import {AlignmentStyle, INDENT_LEVEL_STEP, markTypes, nodeTypes} from '../text-editor/custom-schema';
import {
  chainCommands,
  createParagraphNear,
  exitCode,
  liftEmptyBlock,
  newlineInCode,
  splitBlock,
  splitBlockKeepMarks,
  wrapIn
} from 'prosemirror-commands';
import {canJoin, findWrapping} from 'prosemirror-transform';
import {extendTransaction} from "./transactions-helper";
import {
  ancestorAt,
  areNodeTypesEquals,
  ExtendedNode,
  findAllAncestors,
  findAllNodesBetween,
  findAncestor,
  findAncestorOfType,
  isAlignableNode,
  isListNode
} from "./nodes-helper";
import {expandMarkActiveRange, expandMarkTypeActiveRange, isMarkAllowed} from './marks-helper';
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

    const ancestor = findAncestor($at, (node) => node.type.validContent(fragment));
    if (!ancestor) { return false; } // Cancel if content cannot be inserted at the position specified


    if (dispatch) {
      const tr = state.tr;
      tr.insert(at, fragment);
      dispatch(tr.scrollIntoView());
    }
    return true;
  }
}



/**
 * Replaces the content in the given selection with the content provided.
 * If no end position is passed, the content will be inserted
 * @param content Content to insert
 * @param from Start of the range
 * @param to End of the range
 * @returns Command to replace the content
 */
export function editContent(content: ProseNode | Fragment | readonly ProseNode[], from: number, to?: number): Command {
  if (to && from > to) {
    return editContent(content, to, from);
  }

  return function (state: EditorState, dispatch?: (tr: Transaction) => void): boolean {
    const fragment = Fragment.from(content);
    const $from = state.doc.resolve(from);

    // Insert mode
    if (to == null) {
      const ancestor = findAncestor($from, (node) => node.type.validContent(fragment));
      if (!ancestor) { return false; } // Cancel if content cannot be inserted at the position specified

      if (dispatch) {
        const tr = state.tr;
        tr.insert(from, fragment);
        dispatch(tr.scrollIntoView());
      }
    }
    // Replace mode
    else {
      const $to = state.doc.resolve(to);

      const range = $from.blockRange($to);
      if (!range) { return false; } // Cancel if range do not exist

      const ancestor = findAncestor(
        $from,
        (node) => node.type.validContent(fragment),
        range.depth
      );
      if (!ancestor) { return false; } // Cancel if content cannot be inserted at the position specified

      if (dispatch) {
        const tr = state.tr;
        tr.replaceWith(from, to, fragment);
        dispatch(tr.scrollIntoView());
      }
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

  let wrapping = findWrapping(range, nodeTypes.indent);
  if (!wrapping) {
    const isIndentable = (node: ProseNode) => isValidContent(nodeTypes.indent, node);
    const indentableNode = findAncestor(range.$from, isIndentable, range.depth);

    // Cancel if no parent indentable node is found
    if (!indentableNode) { return false; }

    const $from = state.doc.resolve(indentableNode.before);
    const $to = state.doc.resolve(indentableNode.after);
    range = new NodeRange($from, $to, indentableNode.depth);
    wrapping = findWrapping(range, nodeTypes.indent);
  }

  // Cancel if no valid wrapping parent node is found
  if (!wrapping) { return false; }

  if (dispatch) {
    const tr = extendTransaction(state.tr);

    const parent = ancestorAt(range.$from, range.depth);
    const isParentIndentNode = areNodeTypesEquals(parent.type, nodeTypes.indent)

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

  const indentNode = findAncestorOfType(range.$from, nodeTypes.indent);
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

  const isListItem = (node?: ProseNode | null) => areNodeTypesEquals(node?.type, nodeTypes.list_item);

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

    tr.replaceSelectionWith(state.schema.node(nodeTypes.hard_break), true);

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
 * - splitBlockKeepMarks
 * - splitBlock
 * @param state State of the editor
 * @param dispatch Dispatch function
 * @returns False if the command cannot be executed
 */
export const newBlock: Command = chainCommands(newlineInCode, createParagraphNear, liftEmptyBlock, newListItem, splitBlockKeepMarks, splitBlock);

/**
 * Changes the color of the text
 * @param color New color to change the text into or undefined if the standard color should be used
 * @returns False if the command cannot be executed
 */
export function changeFontColor(color?: string): Command {
  return changeFontMark(markTypes.font_color, {color}, !!color?.trim())
}

/**
 * Changes the background of the text
 * @param color New color to change the background into or undefined if the color should be removed
 * @returns False if the command cannot be executed
 */
export function changeFontBackground(color?: string): Command {
  return changeFontMark(markTypes.font_background, {color}, !!color?.trim())
}

/**
 * Changes the font family of the text
 * @param family New font family to change the font into or undefined if the standard font family should be used
 * @returns False if the command cannot be executed
 */
export function changeFontFamily(family?: string): Command {
  return changeFontMark(markTypes.font_family, {family}, !!family?.trim())
}

/**
 * Changes the font size of the text
 * @param size New font size to change the font into or undefined if the standard font size should be used
 * @returns False if the command cannot be executed
 */
export function changeFontSize(size: string): Command {
  return changeFontMark(markTypes.font_size, {size}, !!size?.trim());
}

// Utility function for all font marks' commands
function changeFontMark(type: MarkType, attrs: Attrs, isAddition: boolean): Command {
  return function (state: EditorState, dispatch?: (tr: Transaction) => void): boolean {
    const {$from, $to} = state.selection;
    const range = $from.blockRange($to);
    if (!range) { return false; }

    const allowsMark = (node: ProseNode) => isMarkAllowed(node, type);
    const validNodes = findAllNodesBetween($from, $to, allowsMark);
    if (validNodes.length === 0) { return false; } // No nodes allow this mark

    if (dispatch) {
      const tr = state.tr;

      if (isAddition) {
        const mark = type.create(attrs);
        tr.addMark($from.pos, $to.pos, mark);
        tr.addStoredMark(mark);
      } else {
        tr.removeMark($from.pos, $to.pos, type);
        tr.removeStoredMark(type);
      }

      dispatch(tr.scrollIntoView());
    }
    return true;
  }
}

/**
 * Changes the text alignment of the paragraph
 * @param alignment New alignment to use for the text paragraph
 * @returns False if the command cannot be executed
 */
export function changeTextAlignment(alignment?: AlignmentStyle): Command {
  return function (state: EditorState, dispatch?: (tr: Transaction) => void): boolean {
    const {$from, $to} = state.selection;
    const range = $from.blockRange($to);
    if (!range) { return false; }

    const alignableChildNodes = findAllNodesBetween($from, $to, isAlignableNode);
    if (alignableChildNodes.length === 0) { return false; } // No alignment can be modified

    if (dispatch) {
      const tr = state.tr;

      for (const paragraph of alignableChildNodes) {
        tr.setNodeAttribute(paragraph.before, 'alignment',  alignment);
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
