/**
 * Extension for ProseMirror Transaction class
 */

import {addProps} from "./multipurpose-helper";
import {TextSelection, Transaction} from "prosemirror-state";
import {ResolvedPos} from "prosemirror-model";
import {ExtendedNode} from "./nodes-helper";

/**
 * Extended document transaction
 */
export type ExtendedTransaction = Transaction & {
  /**
   * Maps the given resolved pos to a new resolved pos in the changed document
   * @param $pos Resolved position to be mapped
   * @returns Mapped position to the changed document
   */
  mapAndResolveResolvedPos: ($pos: ResolvedPos) => ResolvedPos;
  /**
   * Maps the given pos to a new resolved pos in the changed document
   * @param pos Position to be mapped
   * @returns Mapped position to the changed document
   */
  mapAndResolvePos: (pos: number) => ResolvedPos;
  /**
   * Unwraps the content of the given node, mapping the selection accordingly
   * @param node Node whose contents will be unwrapped
   * @returns Transaction for chaining
   */
  unwrapNode: (node: ExtendedNode) => ExtendedTransaction;
  /**
   * Updates the current selection to the corresponding mapped selection
   * @param anchor Anchor of the selection
   * @param head Head of the selection
   * @returns Transaction for chaining
   */
  mapAndSelect: (anchor: number, head: number) => ExtendedTransaction;
}

/**
 * Creates an extended transaction from a basic transaction
 * @param tr Transaction to extend
 * @returns Reference to the given transaction with the extended props
 */
export function extendTransaction(tr: Transaction): ExtendedTransaction {
  const extr = tr as ExtendedTransaction;
  return addProps<ExtendedTransaction>(tr, {
    mapAndResolveResolvedPos: ($pos: ResolvedPos): ResolvedPos => mapAndResolveResolvedPos(extr, $pos),
    mapAndResolvePos: (pos: number): ResolvedPos => mapAndResolvePos(extr, pos),
    unwrapNode: (node: ExtendedNode): ExtendedTransaction => unwrapNode(extr, node),
    mapAndSelect: (anchor: number, head: number): ExtendedTransaction => mapAndSelect(extr, anchor, head),
  })
}

/**
 * Maps the given resolved pos to a new resolved pos in the changed document
 * @param tr Transaction with changes
 * @param $pos Resolved position to be mapped
 * @returns Mapped position to the changed document
 */
export function mapAndResolveResolvedPos(tr: Transaction | ExtendedTransaction, $pos: ResolvedPos): ResolvedPos {
  return mapAndResolvePos(tr, $pos.pos);
}

/**
 * Maps the given pos to a new resolved pos in the changed document
 * @param tr Transaction with changes
 * @param pos Position to be mapped
 * @returns Mapped position to the changed document
 */
export function mapAndResolvePos(tr: Transaction | ExtendedTransaction, pos: number): ResolvedPos {
  return tr.doc.resolve(tr.mapping.map(pos));
}

/**
 * Unwraps the content of the given node, mapping the selection accordingly
 * @param tr Transaction with the document to update
 * @param node Node whose contents will be unwrapped
 * @returns Transaction for chaining
 */
export function unwrapNode<T extends Transaction = Transaction>(tr: T, node: ExtendedNode): T {
  const {$anchor, $head} = tr.selection;

  const from = node.start;
  const to = node.start + node.nodeSize;

  // A wrapping node was replaced with its contents:
  // - Position before unwrapped node --> original position
  // - Position between unwrapped node --> original - 1 (start tag)
  // - Position after unwrapped node --> original - 2 (start & end tag)
  const updatePos = (pos: number): number => (from > pos) ? pos : (pos - (pos < to ? 1 : 2));
  const anchor = updatePos($anchor.pos);
  const head = updatePos($head.pos);

  tr.replaceWith(from, to, node.content);
  tr.setSelection(new TextSelection(tr.doc.resolve(anchor), tr.doc.resolve(head)));

  return tr;
}

/**
 * Maps the selection to their corresponding selection
 * @param tr Transaction with changes
 * @param anchor Anchor of the selection
 * @param head Head of the selection
 * @returns Transaction for chaining
 */
export function mapAndSelect<T extends Transaction = Transaction>(tr: T, anchor: number, head: number): T {
  tr.setSelection(new TextSelection(mapAndResolvePos(tr, anchor), mapAndResolvePos(tr, head)));
  return tr;
}
