/**
 * Custom ProseMirror helper functions for Resolved Pos management
 */
import {Node as ProseNode, ResolvedPos} from 'prosemirror-model';
import {ExtendedNode} from './nodes-helper';

/**
 * Returns the resolved position in the current document limited by both sides
 * @param doc Document in which the position will be resolved
 * @param pos Position to go to
 * @returns Position in the document limited by both sides
 */
export function goTo(doc: ProseNode, pos: number): ResolvedPos;
/** @internal */
export function goTo(doc: ProseNode, pos: number): ResolvedPos {
  if (pos <= 0) { doc.resolve(0); }
  if (pos >= doc.nodeSize) { doc.resolve(doc.nodeSize); }
  return doc.resolve(pos);
}

/**
 * Returns the offset resolved position in the current document limited by both sides
 * @param $pos Resolved position in the document which will be used as base to resolve the new position
 * @param offset Offset to update the position with
 * @returns Offset position in the document limited by both sides
 */
export function moveBy($pos: ResolvedPos, offset: number): ResolvedPos {
  return goTo($pos.doc, $pos.pos + offset);
}

/**
 * Retrieves the offset position in which the node is from its parent's before position
 * @param node Node to retrieve the offset from
 * @param depth Depth of the parent to retrieve the offset from
 * @return Offset from the parent
 */
export function parentOffset(node: ExtendedNode, depth?: number): number {
  return goTo(node, node.before).before(depth) - node.before;
}

/**
 * Calculates the offset from base to post
 * @param base Base position
 * @param pos Offset position
 * @returs Offset from base to pos
 */
export function offsetFrom(base: number, pos: number): number {
  return pos - base;
}
