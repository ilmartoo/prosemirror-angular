/**
 * Custom ProseMirror helper functions for list nodes management
 */

import {Fragment, Node as ProseNode, NodeType, ResolvedPos} from 'prosemirror-model';
import {areNodeTypesEquals, ExtendedNode, extendNode} from './nodes-helper';
import {NodeGroups, nodeTypes} from '../text-editor/custom-schema';
import {addProps} from './multipurpose-helper';
import {goTo, moveBy} from './resolved-pos-helper';
import {isValidContent} from './node-content-helper';

export type ExtendedListItem = ExtendedNode & Readonly<{
  paragraph: ExtendedNode,
  sublist?: ExtendedNode,
}>;

export type ExtendedList = ExtendedNode & Readonly<{
  items: readonly ExtendedListItem[],
}>

/**
 * Extends the current list node, extending all list items
 * @param list List node to extend
 * @param depth Depth of the list node
 * @retuns An extended list node with its children or an empty array if it is not a list
 */
export function extendList(list: ExtendedNode, depth: number = list.depth): ExtendedList {
  if (!isListNode(list)) { return addProps<ExtendedList, ExtendedNode>(list, { items: [] }); }

  const items: ExtendedListItem[] = [];

  let $base = moveBy(goTo(list.doc, list.start), 1);
  // We move to 1 position past the start to always be on a list_item node:
  //
  // [before] <extendedList> [start] ...content... [end] </extendedList> [after]
  //
  // [before] <extendedList> [start] <li> [start + 1] ... </li> ... <li> ... </li> [end] </extendedList> [after]
  //

  list.forEach((node, offset) => {
    items.push(extendListItem(node, moveBy($base, offset), depth + 1))
  });

  return addProps<ExtendedList, ExtendedNode>(list, { items })
}

// Helper function to extend list nodes
function extendListItem(item: ProseNode, $pos: ResolvedPos, depth: number = $pos.depth): ExtendedListItem {
  const paragraph = extendNode(item.child(0), moveBy($pos, 1));
  return addProps<ExtendedListItem, ExtendedNode>(extendNode(item, $pos), {
    paragraph,
    sublist: item.maybeChild(1)
      ? extendNode(item.child(1), moveBy($pos, paragraph.nodeSize + 1), depth + 1)
      : undefined,
  });
}

/**
 * Creates a list node from an ExtendedList
 * @param list Extended list to use
 * @returns Created list node
 */
export function createList(list: ExtendedList): ProseNode {
  const listItems = list.items.map(item =>
    nodeTypes.list_item.create(null, [
      item.paragraph,
      ...(item.sublist ? [createList(extendList(item.sublist))] : [])
    ])
  );
  return list.type.create(null, listItems);
}

/**
 * Retrieves the list item related data located in the given position
 * @param baseList Base list (first level of the nested lists)
 * @param pos Position right before the list item node
 * @returns List item related data if exists, undefined if it does not
 */
export function findListElement(baseList: ExtendedList, pos: number): { list: ExtendedList, index: number, item: ExtendedListItem } | undefined {
  if (pos <= baseList.before || pos >= baseList.after) { return undefined; }

  const $listPos = goTo(baseList.doc, pos);
  const $listItemPos = moveBy($listPos, 1);

  const item = extendListItem($listItemPos.node(), $listItemPos);
  const list = extendList(extendNode($listPos.node(), $listPos));
  const index = list.items.indexOf(item);

  return {
    item,
    list,
    index,
  };
}

/**
 * Checks if a selection of list elements can be indented
 * @param baseList Base list (first level of the nested lists)
 * @param from Position right before the first list item of the selection
 * @param to Position right before the last list item of the selection
 * @returns True if the list elements can be indented
 */
export function canIndentListItems(baseList: ExtendedList, from: number, to?: number): boolean {
  const listItemFrom = findListElement(baseList, from);
  if (!listItemFrom) { return false; } // Position is nonexistent in the list given

  if (to) {
    const listItemTo = findListElement(baseList, to);
    if (!listItemTo) { return false; } // Position is nonexistent in the list given

    if (listItemFrom.list !== listItemTo.list) { return false; } // Items must be in the same list
  }

  const nodeBefore = goTo(baseList.doc, from).nodeBefore;
  return !!nodeBefore && isListItemNode(nodeBefore); // Previous position must exist
}

/**
 * Checks if a selection of list elements can be deindented
 * @param baseList Base list (first level of the nested lists)
 * @param from Position right before the first list item of the selection
 * @param to Position right before the last list item of the selection
 * @returns True if the list elements can be deindented
 */
export function canDeindentListItems(baseList: ExtendedList, from: number, to?: number): boolean {
  const listItemFrom = findListElement(baseList, from);
  if (!listItemFrom) { return false; } // Position is nonexistent in the list given

  let listItemTo: {list: ExtendedList, index: number, item: ExtendedListItem} | undefined;
  if (to) {
    listItemTo = findListElement(baseList, to);
    if (!listItemTo) { return false; } // Position is nonexistent in the list given

    if (listItemFrom.list !== listItemTo.list) { return false; } // Items must be in the same list
  }

  const parentList = goTo(baseList.doc, from).parent;
  if (parentList !== baseList) { return true; }

  // Check if list items can be unwrapped
  const nonListParent = goTo(baseList.doc, baseList.before).parent;

  const p = nodeTypes.paragraph.create();
  const li = nodeTypes.list_item.create(null, p);
  const list = baseList.type.create(null, li);

  return isValidContent(nonListParent.type, Fragment.from([list, p, list]));
}

/**
 * Checks if given node is a list node
 * @param node Node to check
 * @returns True if the node is a list node
 */
export function isListNode(node: ProseNode): boolean {
  return isListNodeType(node.type);
}

/**
 * Checks if given node is a list node type
 * @param type NodeType to check
 * @returns True if the type is a list node type
 */
export function isListNodeType(type: NodeType): boolean {
  return !!type.spec.group?.includes(NodeGroups.LIST);
}

/**
 * Checks if given node is a list item node
 * @param node Node to check
 * @returns True if the node is a list item node
 */
export function isListItemNode(node: ProseNode): boolean {
  return areNodeTypesEquals(nodeTypes.list_item, node.type);
}
