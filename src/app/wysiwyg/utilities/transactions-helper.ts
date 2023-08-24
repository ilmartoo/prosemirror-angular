/**
 * Extension for ProseMirror Transaction class
 */

import {addProps} from "./multipurpose-helper";
import {TextSelection, Transaction} from "prosemirror-state";
import {ResolvedPos} from "prosemirror-model";
import {ExtendedNode} from "./nodes-helper";

/** Extended document transaction */
export type ExtendedTransaction = Transaction & {
  /**
   * Maps the given resolved pos to a new resolved pos in the changed document
   * @param $pos Resolved position to be mapped
   * @returns Mapped position to the changed document
   */
  mapAndResolveResolvedPos($pos: ResolvedPos): ResolvedPos;
  /**
   * Maps the given pos to a new resolved pos in the changed document
   * @param pos Position to be mapped
   * @returns Mapped position to the changed document
   */
  mapAndResolvePos(pos: number): ResolvedPos;
  /**
   * Unwraps the content of the given node, mapping the selection accordingly
   * @param node Node whose contents will be unwrapped
   * @returns Transaction for chaining
   */
  unwrapNode(node: ExtendedNode): ExtendedTransaction;
  /**
   * Updates the current selection to the corresponding mapped selection
   * @param anchor Anchor of the selection
   * @param head Head of the selection
   * @returns Transaction for chaining
   */
  mapAndSelect(anchor: number, head: number): ExtendedTransaction;
}

/**
 * Creates an extended transaction from a basic transaction
 * @param tr Transaction to extend
 * @returns Reference to the given transaction with the extended props
 */
export function extendTransaction(tr: Transaction): ExtendedTransaction {
  const extr = tr as ExtendedTransaction;
  return addProps<ExtendedTransaction>(tr, {
    mapAndResolveResolvedPos: ($pos: ResolvedPos) => mapAndResolveResolvedPos(extr, $pos),
    mapAndResolvePos: (pos: number) => mapAndResolvePos(extr, pos),
    unwrapNode: (node: ExtendedNode) => unwrapNode(extr, node),
    mapAndSelect: (anchor: number, head: number) => mapAndSelect(extr, anchor, head),
  });
}

/**
 * Maps the given resolved pos to a new resolved pos in the changed document
 * @param tr Transaction with changes
 * @param $pos Resolved position to be mapped
 * @returns Mapped position to the changed document
 */
function mapAndResolveResolvedPos(tr: Transaction | ExtendedTransaction, $pos: ResolvedPos): ResolvedPos {
  return mapAndResolvePos(tr, $pos.pos);
}

/**
 * Maps the given pos to a new resolved pos in the changed document
 * @param tr Transaction with changes
 * @param pos Position to be mapped
 * @returns Mapped position to the changed document
 */
function mapAndResolvePos(tr: Transaction | ExtendedTransaction, pos: number): ResolvedPos {
  return tr.doc.resolve(tr.mapping.map(pos));
}

/**
 * Unwraps the content of the given node, mapping the selection accordingly
 * @param tr Transaction with the document to update
 * @param node Node whose contents will be unwrapped
 * @returns Transaction for chaining
 */
function unwrapNode<T extends Transaction = Transaction>(tr: T, node: ExtendedNode): T {
  const {$anchor, $head} = tr.selection;

  const from = node.before;
  const to = node.after;
  const startDiff = node.start - from;
  const endDiff = to - node.end;

  const updatePos = (pos: number): number => {
    if (from > pos) { return pos; }           // Pos before replaced content
    if (to > pos) { return pos - startDiff; } // Pos inside replaced content
    return pos - (startDiff + endDiff);       // Pos after replaced content
  }
  const anchor = updatePos($anchor.pos);
  const head = updatePos($head.pos);

  return tr
    .replaceWith(from, to, node.content)
    .setSelection(new TextSelection(tr.doc.resolve(anchor), tr.doc.resolve(head)));
}

/**
 * Maps the selection to their corresponding selection
 * @param tr Transaction with changes
 * @param anchor Anchor of the selection
 * @param head Head of the selection
 * @returns Transaction for chaining
 */
function mapAndSelect<T extends Transaction = Transaction>(tr: T, anchor: number, head: number): T {
  return tr
    .setSelection(new TextSelection(mapAndResolvePos(tr, anchor), mapAndResolvePos(tr, head)));
}
