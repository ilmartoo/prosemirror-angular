/**
 * Custom ProseMirror helper functions for Mark management
 */

import {Attrs, Mark, MarkType, Node as ProseNode, NodeRange, ResolvedPos} from "prosemirror-model";
import {EditorState} from "prosemirror-state";
import {addProps, areEquals, FilterKeys, filterProps} from "./multipurpose-helper";

/** Alias for the needed Mark elements to perform a ProseMirrorHelper mark lookup */
export type MarkForLookup = Mark | { type: { name: string }, attrs?: Attrs };
/** Alias for the needed MarkType elements to perform a ProseMirrorHelper mark type lookup */
export type MarkTypeForLookup = MarkType | { name: string };
/** Mark data & position for helper functions */
export type ExtendedMark = Mark & { pos: number };

/**
 * Retrieves all active marks in any subsection of the document range
 * @param node Editor node to be used for the mark lookup
 * @param start Starting position (inclusive)
 * @param end End position (inclusive)
 * @returns List of all active marks
 */
export function activeMarksInRange(node: ProseNode, start: number, end: number): Mark[] {
  if (start > end) {
    return activeMarksInRange(node, end, start);
  }

  const activeMarks = new Set<Mark>();

  for (let i = start; i <= end; i++) {
    node.resolve(i).marks().forEach((mark) => activeMarks.add(mark));
  }

  return Array.from(activeMarks);
}

/**
 * Gets active marks for the current cursor position
 * @param state State of the editor
 * @return Array of active marks
 */
export function activeMarksInSelectionEnd(state: EditorState): Mark[] {
  const storedMarks = state.storedMarks;
  const $to = state.selection.$to;

  // Return either the stored marks, or the marks at the cursor position.
  // Note:
  //   Stored marks are the marks that are going to be applied to the next
  //   input if you dispatched a mark toggle with an empty cursor.
  const activeMarks = storedMarks ?? $to.marks();
  return activeMarks.map(m => m);
}

/**
 * Gets active marks for the current selection
 * @param state State of the editor
 * @return Array of active marks
 * @private
 */
export function activeMarksInSelection(state: EditorState): Mark[] {
  const isEmpty = state.selection.empty;

  if (isEmpty) {
    return activeMarksInSelectionEnd(state);
  } else {
    const $head = state.selection.$head; // Dynamic end of the selection
    const $anchor = state.selection.$anchor; // export function end of the selection
    return activeMarksInRange(state.doc, $head.pos, $anchor.pos);
  }
}

/**
 * Looks for a mark type in a range
 * @param type Mark type to look for
 * @param node Editor node to be used for the mark lookup
 * @param start Starting position (inclusive)
 * @param end End position (inclusive)
 * @returns ResolvedLocation of the first mark that matches the given type or undefined if not found
 */
export function searchForMarkTypeInRange(type: MarkTypeForLookup,
                                         node: ProseNode,
                                         start: number,
                                         end: number): ExtendedMark | undefined {
  if (start > end) {
    return searchForMarkTypeInRange(type, node, end, start);
  }

  for (let pos = start; pos <= end; pos++) {
    const $pos = node.resolve(pos);
    const mark = isMarkTypeActiveAt(type, $pos);
    if (mark) {
      return mark;
    }
  }

  return undefined;
}

/**
 * Looks for a mark type in the current selection
 * @param type Mark type to look for
 * @param state State of the editor
 * @returns ResolvedLocation of the first mark that matches the given type or undefined if not found
 */
export function searchForMarkTypeInSelection(type: MarkTypeForLookup, state: EditorState): ExtendedMark | undefined {
  return searchForMarkTypeInRange(type, state.doc, state.selection.from, state.selection.to);
}

/**
 * Retrieves mark if is the same type and active at a position
 * @param type Mark type to check
 * @param $pos Document resolved position to check
 * @returns Mark reference of the active mark at the given position or undefined if inactive
 */
export function isMarkTypeActiveAt(type: MarkTypeForLookup, $pos: ResolvedPos): ExtendedMark | undefined {
  const mark = $pos.marks().find(m => m.type.name === type.name);
  return mark ? addProps<ExtendedMark>(mark, {pos: $pos.pos}) : undefined;
}

/**
 * Calculates the active range of a mark inside a node by expanding both sides starting from a given position
 * @param node Node in which the search will be done
 * @param mark Mark to look for
 * @param position Start position from which the range will be expanded
 * @returns Active range of the given mark in the given node including the given position
 */
export function expandMarkActiveRange(node: ProseNode, mark: MarkForLookup, position: number): NodeRange | null {
  const hasMark = (pos: number): boolean => !!isMarkActiveInNodeAt(mark, node, pos);

  // Check if
  if (!hasMark(position)) {
    return null;
  }

  // Start position
  let start = position;
  while (start > 0) {
    start--;
    if (!hasMark(start)) {
      break;
    }
  }

  // End position
  let end = position;
  const docEnd = node.nodeSize - 1;
  while (end < docEnd) {
    end++;
    if (!hasMark(end)) {
      break;
    }
  }

  // Mark expanded range
  const startPos = node.resolve(start);
  const endPos = node.resolve(end);
  return new NodeRange(startPos, endPos, 0);
}

/**
 * Calculates the active range of a mark type inside a node by expanding both sides starting from a given position
 * @param node Node in which the search will be done
 * @param mark Mark to look for
 * @param position Start position from which the range will be expanded
 * @returns Active range of the given mark in the given node including the given position
 */
export function expandMarkTypeActiveRange(node: ProseNode, mark: MarkTypeForLookup, position: number): NodeRange | null {
  const hasMarkType = (pos: number): boolean => !!isMarkTypeActiveInNodeAt(mark, node, pos);

  // Check if
  if (!hasMarkType(position)) {
    return null;
  }

  // Start position
  let start = position;
  while (start > 0) {
    start--;
    if (!hasMarkType(start)) {
      break;
    }
  }

  // End position
  let end = position;
  const docEnd = node.nodeSize - 1;
  while (end < docEnd) {
    end++;
    if (!hasMarkType(end)) {
      break;
    }
  }

  // Mark expanded range
  const startPos = node.resolve(start);
  const endPos = node.resolve(end);
  return new NodeRange(startPos, endPos, 1);
}

/**
 * Retrieves mark if is active at a position of a node
 * @param type Mark type to check
 * @param node Node on which the check will be performed
 * @param pos Document raw position to check
 * @returns Mark reference of the active mark at the given position of the node or undefined if inactive
 */
export function isMarkTypeActiveInNodeAt(type: MarkTypeForLookup,
                                         node: ProseNode,
                                         pos: number): ExtendedMark | undefined {
  return isMarkTypeActiveAt(type, node.resolve(pos));
}

/**
 * Retrieves mark if is active at a position
 * @param mark Mark to check
 * @param $pos Document resolved position to check
 * @returns Mark reference of the active mark at the given position or undefined if inactive
 */
export function isMarkActiveAt(mark: MarkForLookup, $pos: ResolvedPos): ExtendedMark | undefined {
  const activeMark = isMarkTypeActiveAt(mark.type, $pos);
  return areMarksEquals(mark, activeMark) ? activeMark : undefined;
}

/**
 * Retrieves mark if is active at a position of a node
 * @param mark Mark to check
 * @param node Node on which the check will be performed
 * @param pos Document raw position to check
 * @returns Mark reference of the active mark at the given position of the node or undefined if inactive
 */
export function isMarkActiveInNodeAt(mark: MarkForLookup, node: ProseNode, pos: number): ExtendedMark | undefined {
  return isMarkActiveAt(mark, node.resolve(pos));
}

/**
 * Checks if two marks are the same (taking into account attrs)
 * @param a Mark a
 * @param b Mark b
 * @param filter Keys to filter by
 * @returns True if marks are the same
 */
export function areMarksEquals(
  a?: MarkForLookup,
  b?: MarkForLookup,
  filter?: FilterKeys<Attrs>
): boolean {
  const attrsA = filterProps<Attrs>(a?.attrs, filter);
  const attrsB = filterProps<Attrs>(b?.attrs, filter);
  return areMarkTypesEquals(a?.type, b?.type) && areEquals<Attrs>(attrsA, attrsB);
}

/**
 * Checks if two mark types are the same
 * @param a Mark type a
 * @param b Mark type b
 * @returns True if mark types are the same
 */
export function areMarkTypesEquals(a?: MarkTypeForLookup, b?: MarkTypeForLookup): boolean {
  return a?.name === b?.name;
}

/**
 * Checks if a mark type is allowed inside the specified node
 * @param node Node to check if the mark is allowed
 * @param markType Mark type for checking
 * @returns Returns `true` if the mark is allowed, `false` otherwise
 */
export function isMarkAllowed(node: ProseNode, markType: MarkType): boolean {
  return node.inlineContent && node.type.allowsMarkType(markType);
}
