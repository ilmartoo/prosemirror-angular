/**
 * Custom ProseMirror custom functions
 */

import {Command, EditorState, Selection, TextSelection, Transaction} from 'prosemirror-state';
import {Attrs, Fragment, Mark, MarkType, Node as ProseNode, NodeRange, NodeType} from 'prosemirror-model';
import {AlignableNodeData, AlignmentStyle, INDENT_LEVEL_STEP, markTypes, nodeTypes} from '../text-editor/custom-schema';
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
import {findWrapping} from 'prosemirror-transform';
import {extendTransaction} from "./transactions-helper";
import {
  ancestorAt,
  areNodeTypesEquals,
  ExtendedNode,
  findAllAncestors,
  findAllNodesBetween,
  findAncestor,
  findAncestorOfType,
  findNodeBetween,
  isAlignableNode,
} from "./nodes-helper";
import {expandMarkActiveRange, expandMarkTypeActiveRange, isMarkAllowed} from './marks-helper';
import {createTable} from './table-helper';
import {isValidContent} from './node-content-helper';
import {
  canDeindentListItems,
  canIndentListItems,
  ExtendedList,
  ExtendedListItem,
  extendList,
  findListElement,
  isListItemNode,
  isListNode,
  isListNodeType
} from './list-helper';
import {goTo, offsetFrom} from './resolved-pos-helper';

/**
 * Selects the text of the given range
 * @param from Start of the range
 * @param to End of the range
 * @returns The command to select the text between the given positions
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
 * @returns The command to replace the text
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

export function clearFormat(from: number, to: number): Command {
  if (from > to) {
    return clearFormat(to, from);
  }

  return function (state: EditorState, dispatch?: (tr: Transaction) => void): boolean {
    if (dispatch) {
      const tr = state.tr;

      tr.removeMark(from, to);

      const nodesToClear = findAllNodesBetween(goTo(tr.doc, from), goTo(tr.doc, to), () => true);
      for (const node of nodesToClear) {
        if (isAlignableNode(node)) {
          tr.setNodeAttribute(node.before, AlignableNodeData.ATTR_NAME, AlignableNodeData.DEFAULT_VALUE);
        }
      }

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
 * @returns The command to remove the mark, mark type or all marks in the selection
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
 * @returns The command remove the marks and mark types from the expanded ranges
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

      expansions.forEach(exp => tr.removeMark(exp.range.$from.pos, exp.range.$to.pos, exp.mark));

      dispatch(tr.scrollIntoView());
    }
    return true;
  }
}

/**
 * Inserts content at the given position of the editor
 * @param at Position to insert
 * @param content Content to insert
 * @returns The command to insert the content at the given position
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
 * @returns The command to replace the content
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

      const depth = $from.parent === $to.parent ? $from.depth : $from.blockRange($to)?.depth;
      if (!depth) { return false; } // Cancel if range do not exist

      const ancestor = findAncestor(
        $from,
        (node) => node.type.validContent(fragment),
        depth
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
 * @returns The command to insert a table with the given dimensions at the specified position of the document
 */
export function insertTable(at: number, rows: number, cols: number): Command {
  return function (state: EditorState, dispatch?: (tr: Transaction) => void): boolean {
    if (rows < 1 || cols < 1) { return false; } // Cancel if dimensions of the table are not valid

    const table = createTable(rows, cols);
    return insertContent(at, table)(state, dispatch);
  }
}

/**
 * Increases indent on selected area
 * @param state State of the editor
 * @param dispatch Dispatch function
 * @returns False if the command cannot be executed
 */
export const increaseBlockIndent: Command = (state: EditorState, dispatch?: (tr: Transaction) => void): boolean => {
  const {$from, $to, $head , $anchor} = state.selection;
  const range = $head.blockRange($anchor);
  if (!range) { return false; }

  const indentableNodesDepth = range.depth + 1;
  const content = findAllNodesBetween(
    $from,
    $to,
    (node, pos, depth) => depth === indentableNodesDepth,
  );
  if (content.length === 0) { return false; }

  const isIndentable = (node: ProseNode) => isValidContent(nodeTypes.indent, node);
  const allNodesAreIndentable = content.every(isIndentable);
  if (!allNodesAreIndentable) { return false; } // Can't indent if not all nodes are indentable

  const $start = state.doc.resolve(content[0].before);
  const $end = state.doc.resolve(content[content.length - 1].after);
  const wrapRange = new NodeRange($start, $end, range.depth);

  const parent = ancestorAt($anchor, range.depth);
  const isParentIndentNode = areNodeTypesEquals(parent.type, nodeTypes.indent);
  const isOnlyIndentedContent = parent.content.size === ($end.pos - $start.pos);

  // Update indent level if is already wrapped and is the only content of the indentation
  if (isParentIndentNode && isOnlyIndentedContent) {
    if (dispatch) {
      const tr = extendTransaction(state.tr);

      const updatedLevel = parent.attrs['level'] + INDENT_LEVEL_STEP;
      tr.setNodeAttribute(parent.before, 'level',  updatedLevel);

      dispatch(tr.scrollIntoView());
    }
  }
  else {
    const wrapping = findWrapping(wrapRange, nodeTypes.indent);
    if (!wrapping) { return false; } // No wrapping could be found

    if (dispatch) {
      const tr = extendTransaction(state.tr);

      tr.wrap(range, wrapping);
      tr.mapAndSelect($anchor.pos, $head.pos);

      dispatch(tr.scrollIntoView());
    }
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

  const indentNode = findAncestorOfType(range.$from, nodeTypes.indent, range.depth);
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
  const {$from, $to, $anchor, $head} = state.selection;
  const range = $from.blockRange($to);
  if (!range) { return false; }

  const listNodes = findAllAncestors($from, isListNode, range.depth);
  if (listNodes.length === 0) { return false; } // Is not inside a list

  const selectionList = listNodes[0];
  const baseList = listNodes[listNodes.length - 1];
  const extBaseList = extendList(baseList, baseList.depth);

  const firstListElement = findListElement(extBaseList, $from.before(selectionList.depth + 1));
  const lastListElement = findListElement(extBaseList, $to.before(selectionList.depth + 1));
  if (!firstListElement || !lastListElement) { return false; } // No list elements can be found

  const canIndent = canIndentListItems(extBaseList, firstListElement.item.before, lastListElement.item.before);
  if (!canIndent) { return false; } // Cannot indent list items

  const prevItem = firstListElement.list.items[firstListElement.index - 1];
  if (!prevItem) { return false; } // Previous position does not exist

  if (dispatch) {
    const tr = state.tr;

    const posBeforeFirstItem = firstListElement.item.before - selectionList.before;
    const posEndLastItem = lastListElement.item.end - selectionList.before;
    const listItemsCut = selectionList.cut(posBeforeFirstItem, posEndLastItem).content;

    const replaceFrom = prevItem.before;
    const replaceTo = lastListElement.item.end;

    let content = nodeTypes.list_item.create(null, [
        prevItem.paragraph,
        prevItem.sublist
          ? prevItem.sublist.type.create(prevItem.sublist.attrs, prevItem.sublist.content.append(listItemsCut))
          : selectionList.type.create(null, listItemsCut)
      ]
    );
    tr.replaceWith(replaceFrom, replaceTo, content);

    const selectionPosDiff = prevItem.sublist
      ? -2 // -2 because we remove a list closing tag and list item closing tag from ahead
      : 0;
    const $newAnchor = goTo(tr.doc, $anchor.pos + selectionPosDiff);
    const $newHead = goTo(tr.doc, $head.pos + selectionPosDiff);
    tr.setSelection(new TextSelection($newAnchor, $newHead));

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
  const initialSelection = state.selection;
  const {$from, $to} = initialSelection;
  const range = $from.blockRange($to);
  if (!range) { return false; }

  const listNodes = findAllAncestors($from, isListNode, range.depth);
  if (listNodes.length === 0) { return false; } // Is not inside a list

  const selectionList = listNodes[0];
  const baseList = listNodes[listNodes.length - 1];
  const extBaseList = extendList(baseList, baseList.depth);

  const firstListElement = findListElement(extBaseList, $from.before(selectionList.depth + 1));
  const lastListElement = findListElement(extBaseList, $to.before(selectionList.depth + 1));
  if (!firstListElement || !lastListElement) { return false; } // No list elements can be found

  const canDeindent = canDeindentListItems(extBaseList, firstListElement.item.before, lastListElement.item.before);
  if (!canDeindent) { return false; } // Cannot indent list items

  if (dispatch) {
    const tr = state.tr;

    if (listNodes.length === 1) {
      deindentFromBaseList(tr, initialSelection, extBaseList, firstListElement.index, lastListElement.index);
    }
    else {
      const parentItem = ancestorAt($from, selectionList.depth - 1);
      const parent = findListElement(extBaseList, parentItem.before)!;

      deindentFromSubList(tr, initialSelection, parent.list, parent.item, selectionList, firstListElement.item, lastListElement.item);
    }
    dispatch(tr.scrollIntoView());
  }
  return true;
}

// Helper function to deindent a list when it is the base list
function deindentFromBaseList(
  tr: Transaction,
  initialSelection: Selection,
  baseList: ExtendedList,
  firstSelectedItemIndex: number,
  lastSelectedItemIndex: number,
) {
  const beforeDeindentContent: ProseNode[] = [];
  const extractedNodes: ProseNode[] = [];
  let afterDeindentContent: Fragment = Fragment.empty;

  let toPosDiff = 0;

  let i = 0;
  // Before selection
  for (; i < firstSelectedItemIndex; i++) {
    beforeDeindentContent.push(baseList.items[i]);
  }

  // Inside selection and before last item selected
  for (; i < lastSelectedItemIndex; i++) {
    const li = baseList.items[i];
    extractedNodes.push(
      li.paragraph,
      ...(li.sublist ? [li.sublist] : [])
    );
    toPosDiff -= 2;
  }

  // Last item selected
  const lastElement = baseList.items[i];
  i++;

  // After selection
  for (; i < baseList.items.length; i++) {
    afterDeindentContent = afterDeindentContent.append(
      Fragment.from(baseList.items[i])
    );
  }

  extractedNodes.push(lastElement.paragraph);
  const listLE = lastElement.sublist;
  extractedNodes.push(listLE
    ? listLE.type.create(listLE.attrs, listLE.content.append(afterDeindentContent))
    : baseList.type.create(baseList.attrs, afterDeindentContent)
  );



  const fragmentFromListSlice = (nodes: ProseNode[]) =>
    nodes.length > 0
      ? Fragment.from(baseList.type.create(baseList.attrs, nodes))
      : Fragment.empty;

  const replacedContent = Fragment.empty
    .append(fragmentFromListSlice(beforeDeindentContent))
    .append(Fragment.from(extractedNodes));

  tr.replaceWith(baseList.before, baseList.end, replacedContent);

  const {$anchor, $head} = initialSelection;
  const isAnchorBefore = $anchor.pos <= $head.pos;
  const correspondingDiff = (isAnchor: boolean) => isAnchor === isAnchorBefore ? 0 : toPosDiff;

  const $newAnchor = goTo(tr.doc, $anchor.pos + correspondingDiff(true));
  const $newHead = goTo(tr.doc, $head.pos + correspondingDiff(false));
  tr.setSelection(new TextSelection($newAnchor, $newHead));
}

// Helper function to deindent a list when it is not the base list
function deindentFromSubList(
  tr: Transaction,
  initialSelection: Selection,
  parentList: ExtendedNode,
  parentListSelectedItem: ExtendedListItem,
  selectionList: ExtendedNode,
  firstSelectedItem: ExtendedListItem,
  lastSelectedItem: ExtendedListItem,
) {

  //    FS | 1LI                        1LI
  //       | 2LI                        2LI
  //       | 3LI                        3LI
  //          ·                          ·
  //    SI | 4LI                        4LI
  //          ·                          ·
  // SI_BS |  - 4.1LI                    - 4.1LI
  //          ·                          ·
  // SI_SS |  - 4.2LI <<[Selection]     4.2LI
  //       |  - 4.3LI <<[Selection]     4.3LI
  //          ·                          ·
  // SI_SL |  - 4.4LI <<[Selection]     4.4LI
  //          ·                          ·
  // SI_AS |  - 4.5LI                    - 4.5LI
  //          ·                          ·
  //    LS | 5LI                        5LI
  //       | 6LI                        6LI
  //       | 7LI                        7LI

  const offsetFromParentList = (pos: number) => offsetFrom(parentList.before, pos);
  const offsetFromSelectionList = (pos: number) => offsetFrom(selectionList.before, pos);

  // FS - List content before sublist item
  const startFS = offsetFromParentList(parentList.before);
  const endFS = offsetFromParentList(parentListSelectedItem.before - 1); // -1 to remove unmatched closing tags
  const FS = parentList.cut(startFS, endFS).content;

  // LS - List content after sublist item
  const startLS = offsetFromParentList(parentListSelectedItem.after);
  const endLS = offsetFromParentList(parentList.end - 1); // -1 to remove unmatched closing tags
  const LS = parentList.cut(startLS, endLS).content;

  // SI_BS - Sublist item until selection start
  const startSI_BS = offsetFromSelectionList(selectionList.start);
  const endSI_BS = offsetFromSelectionList(firstSelectedItem.before - 1); // -1 to remove unmatched closing tags
  const SI_BS = selectionList.cut(startSI_BS, endSI_BS).content;

  // SI + SI_BS - List item with selection + Sublist item until selection start
  const SI__SI_BS = Fragment.from(
    parentListSelectedItem.type.create(
      parentListSelectedItem.attrs,
      [
        parentListSelectedItem.paragraph,
        ...(SI_BS.childCount > 0 ? [selectionList.type.create(selectionList.attrs, SI_BS)] : [])
      ]
    )
  );

  // SI_AS - Sublist items after last item
  const startSI_AS = offsetFromSelectionList(lastSelectedItem.after);
  const endSI_AS = offsetFromSelectionList(selectionList.end - 1); // -1 to remove unmatched closing tags
  const SI_AS = selectionList.cut(startSI_AS, endSI_AS).content;

  // SI_SS - Sublist minus last selected item & rest
  const startSI_SS = offsetFromSelectionList(firstSelectedItem.before);
  const endSI_SS = offsetFromSelectionList(lastSelectedItem.before - 1); // -1 to remove unmatched closing tags
  const SI_SS = selectionList.cut(startSI_SS, endSI_SS).content;

  // SI_SL + SI_AS - Last item & rest
  const lastItemSublist = lastSelectedItem.sublist;
  const isEmptySI_AS = SI_AS.childCount === 0;

  const contentListSI_SL = Fragment.empty
    .append(lastItemSublist?.content ?? Fragment.empty)
    .append(isEmptySI_AS ? Fragment.empty : SI_AS);

  const contentSI_SL__SI_AS: ProseNode[] = [
    lastSelectedItem.paragraph,
    ...(
      lastItemSublist
        ? [lastItemSublist.type.create(lastItemSublist.attrs, contentListSI_SL)]
        : (isEmptySI_AS ? [] : [selectionList.type.create(null, contentListSI_SL)])
    )
  ];

  const SI_SL__SI_AS = Fragment.from(
    lastSelectedItem.type.create(lastSelectedItem.attrs, contentSI_SL__SI_AS)
  );

  // Replace parent list with modified parent list
  const newParentListContent = Fragment.empty
    .append(FS)
    .append(SI__SI_BS)
    .append(SI_SS)
    .append(SI_SL__SI_AS)
    .append(LS)
  const newParentList = parentList.type.create(parentList.attrs, newParentListContent);

  tr.replaceWith(parentList.before, parentList.end, newParentList);

  const {$anchor, $head} = initialSelection;
  const selectionPosDiff = SI_BS.childCount === 0
    ? 0
    : 2; // +2 because we add a list closing tag and a list item closing tag ahead
  const $newAnchor = goTo(tr.doc, $anchor.pos + selectionPosDiff);
  const $newHead = goTo(tr.doc, $head.pos + selectionPosDiff);
  tr.setSelection(new TextSelection($newAnchor, $newHead));
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
 * Changes the parent element's list type from the current cursor position to the one specified
 * @param listType New list node type
 * @param attrs Attrs for the new list node
 * @returns The command to change the parent list type
 */
export function changeListType(listType: NodeType, attrs?: Attrs | null): Command {
  return function (state: EditorState, dispatch?: (tr: Transaction) => void): boolean {
    const {$from, $to} = state.selection;
    const range = $from.blockRange($to);
    if (!range) { return false; }

    const isDifferentListType = (node: ProseNode): boolean =>
      isListNode(node) && !areNodeTypesEquals(node.type, listType) && isValidContent(listType, node.content);
    const listNode = findAncestor($from, isDifferentListType, range.depth);
    if (!listNode) { return false; } // Cancel if no different list type with compatible content is found

    if (dispatch) {
      const tr = state.tr;

      tr.setNodeMarkup(listNode.before, listType, attrs);

      dispatch(tr.scrollIntoView());
    }
    return true;
  }
}

/**
 * Unwraps the selected list type
 * @param listType List type to unwrap
 * @returns The command to unwrap a list
 */
export function unwrapFromList(listType: NodeType): Command {
  return function (state: EditorState, dispatch?: (tr: Transaction) => void): boolean {
    const {$from, $to} = state.selection;
    const range = $from.blockRange($to);
    if (!range) { return false; }

    const wrapper = findAncestor($from, isListNode, range.depth);
    if (!wrapper || !areNodeTypesEquals(wrapper.type, listType)) { return false; } // The nearest list is not from the specified type

    if (dispatch) {
      const tr = extendTransaction(state.tr);

      const wrapperParent = ancestorAt($from, wrapper.depth - 1);
      const children: ProseNode[] = [];
      for (let i = 0; i < wrapper.childCount; i++) {
        const child = wrapper.child(i);
        children.push(isValidContent(wrapperParent.type, child) ? child : child.child(0));
      }
      tr.replaceWith(wrapper.before, wrapper.after, children);

      const $pos = tr.doc.resolve(wrapper.start);
      tr.setSelection(new TextSelection($pos, $pos));

      dispatch(tr.scrollIntoView());
    }
    return true;
  }
}

/**
 * Wraps the selected items into a list
 * @param listType List type use as wrap
 * @returns The command to wrap elements into a list
 */
export function wrapInList(listType: NodeType): Command {
  return function (state: EditorState, dispatch?: (tr: Transaction) => void): boolean {
    const {$from, $to} = state.selection;
    const range = $from.blockRange($to);
    if (!range) { return false; }

    if (!isListNodeType(listType)) { return false } // Cancel if it is not a valid list type

    const listNodesDepth = range.depth + 1;
    const nodes = findAllNodesBetween($from, $to,
      (node, pos, depth) => depth === listNodesDepth
    );

    if (nodes.length === 0) { return false; } // Cancel if no children is found

    const parent = ancestorAt($from, range.depth);

    if (isListItemNode(parent) || isListNode(parent)) { return false; } // Cancel wrap if it is inside a list

    if (!nodes.every(node =>
      isValidContent(listType, node) || isValidContent(nodeTypes.list_item, node)
    )) { return false; } // All elements must be a list or valid content for a list item

    if (dispatch) {
      const tr = extendTransaction(state.tr);

      const parsedNodes = nodes.map((node) =>
        isValidContent(listType, node) ? node : nodeTypes.list_item.create(null, node)
      );

      let list: ProseNode;
      // Replace current list & append elements
      const firstNode = parsedNodes[0];
      if (isListNode(firstNode)) {
        list = listType.create(null, firstNode.content.append(Fragment.from(parsedNodes.slice(1))));
      }
      // Create a list normally
      else {
        list = listType.create(null, parsedNodes);
      }

      const from = nodes[0].before;
      const to = nodes[nodes.length - 1].after;

      tr.replaceWith(from, to, list);

      const newPosNode = findNodeBetween(tr.doc.resolve(from), tr.doc.resolve(to), (node) => node.inlineContent);
      if (newPosNode) {
        const $pos = tr.doc.resolve(newPosNode.start);
        tr.setSelection(new TextSelection($pos, $pos));
      }

      dispatch(tr.scrollIntoView());
    }
    return true;
  }
}

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
  chainCommands(unwrapFromList(listType), changeListType(listType), wrapInList(listType));

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
        tr.setNodeAttribute(paragraph.before, AlignableNodeData.ATTR_NAME,  alignment);
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
