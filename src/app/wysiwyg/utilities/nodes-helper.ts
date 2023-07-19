/**
 * Custom ProseMirror helper functions for Node management
 */

import {Attrs, Node as ProseNode, NodeType, ResolvedPos} from "prosemirror-model";
import {EditorState} from "prosemirror-state";
import {addProps, areEquals} from "./multipurpose-helper";

/** Alias for the needed Node elements to perform a ProseMirrorHelper node lookup */
export type NodeForLookup = ProseNode | { type: { name: string }, attrs?: Attrs };
/** Alias for the needed NodeType elements to perform a ProseMirrorHelper node type lookup */
export type NodeTypeForLookup = NodeType | { name: string };
/**
 * Node data & position for helper functions
 */
export type ExtendedNode = ProseNode & { start: number, depth: number };
/**
 * Ancestor of a node
 */
export type AncestorNode = ExtendedNode & { parent?: AncestorNode };

/** List to display & relate ancestors of a node */
export class AncestorNodeList extends Array<AncestorNode> {

  constructor(...ancestors: ExtendedNode[]) {
    super();
    super.push(...this.linkAncestors(ancestors));
  }

  /**
   * Appends the ancestors to the end of the ancestor list, making the last one the parent of the last ancestor appended
   * @param ancestors Ancestor nodes to append
   * @returns Updated length of the ancestor list
   */
  override push(...ancestors: ExtendedNode[]): number {
    super.push(...this.linkAncestors(ancestors));
    return this.length;
  }

  /**
   * Links the array of nodes as ancestors by the order established in the array --> [1] will be the parent of [0] and so on
   * @param ancestors Array of ancestors
   * @returns Array of linked ancestors
   * @private
   */
  private linkAncestors(ancestors: ExtendedNode[]): AncestorNode[] {
    const linkedAncestors: AncestorNode[] = [];

    if (ancestors.length > 0) {
      linkedAncestors.push(addProps<AncestorNode>(ancestors[0], {parent: undefined}));

      for (let i = 1; i < ancestors.length; i++) {
        linkedAncestors.push(addProps<AncestorNode>(ancestors[i], {parent: undefined}));
        linkedAncestors[i - 1].parent = linkedAncestors[i];
      }
    }

    return linkedAncestors;
  }
}

/**
 * Retrieves a list of all the ancestor nodes at a given position
 * @param $pos Position to get all the ancestors from
 * @returns List of all ancestors at the given position
 */
export function ancestorNodesAt($pos: ResolvedPos): ExtendedNode[] {
  const parents: ExtendedNode[] = [];
  for (let depth = $pos.depth; depth > 0; depth--) {
    parents.push(addProps<ExtendedNode>($pos.node(depth), {start: $pos.start(depth), depth: depth}))
  }
  return parents;
}

/**
 * Retrieves all ancestor nodes in any subsection of the document
 * @param node Editor node to be used for the mark lookup
 * @param start Starting position (inclusive)
 * @param end End position (inclusive)
 * @returns List of all parent nodes
 */
export function ancestorNodesInRange(node: ProseNode, start: number, end: number): ExtendedNode[] {
  if (start > end) {
    return ancestorNodesInRange(node, end, start);
  }

  const presentNodes = new Set<ExtendedNode>();

  for (let i = start; i <= end; i++) {
    ancestorNodesAt(node.resolve(i)).forEach(ancestor => presentNodes.add(ancestor));
  }

  return Array.from(presentNodes);
}

/**
 * Gets ancestor nodes for the current cursor position
 * @param state State of the editor
 * @return Ancestor nodes at cursor position
 */
export function ancestorNodesInSelectionEnd(state: EditorState): ExtendedNode[] {
  return ancestorNodesAt(state.selection.$to);
}

/**
 * Gets all ancestor nodes for the current selection (removing duplicate node types)
 * @param state State of the editor
 * @return Array of active nodes
 */
export function ancestorNodesInSelection(state: EditorState): ExtendedNode[] {
  const isEmpty = state.selection.empty;

  if (isEmpty) {
    return ancestorNodesInSelectionEnd(state);
  } else {
    const $head = state.selection.$head; // Dynamic end of the selection
    const $anchor = state.selection.$anchor; // export function end of the selection
    return ancestorNodesInRange(state.doc, $head.pos, $anchor.pos);
  }
}

/**
 * Checks if two nodes are the same (taking into account attrs)
 * @param a Node a
 * @param b Node b
 * @returns True if nodes are the same
 */
export function areNodesEquals(a?: NodeForLookup, b?: NodeForLookup): boolean {
  return areNodeTypesEquals(a?.type, b?.type) && areEquals<Attrs>(a?.attrs, b?.attrs);
}

/**
 * Checks if two node types are the same
 * @param a Node type a
 * @param b Node type b
 * @returns True if node types are the same
 */
export function areNodeTypesEquals(a?: NodeTypeForLookup, b?: NodeTypeForLookup): boolean {
  return a?.name === b?.name;
}

/**
 * Searches for the closest ancestor node that satisfies the given condition
 * @param $pos Starting position for ancestor lookup
 * @param isValid Function to check if ancestor is valid
 * @param startDepth Starting depth to check from (default is $pos.depth)
 * @returns Ancestor node that satisfies the condition or undefined if not found
 */
export function findAncestor($pos: ResolvedPos,
                             isValid: (node: ProseNode) => boolean,
                             startDepth?: number): AncestorNode | undefined {
  for (let depth = startDepth ?? $pos.depth; depth >= 0; depth--) {
    const node = $pos.node(depth);
    if (isValid(node)) {
      return addProps<AncestorNode>(node, {start: $pos.before(depth), depth: depth});
    }
  }
  return undefined;
}

/**
 * Searches for all the ancestor nodes that satisfies the given condition
 * @param $pos Starting position for ancestor lookup
 * @param isValid Function to check if ancestor is valid
 * @param startDepth Starting depth to check from (default is $pos.depth)
 * @returns Ancestor nodes that satisfies the condition or empty array if none found
 */
export function findAllAncestors($pos: ResolvedPos,
                                 isValid: (node: ProseNode) => boolean,
                                 startDepth?: number): AncestorNodeList {
  const parents = new AncestorNodeList();
  for (let depth = startDepth ?? $pos.depth; depth >= 0; depth--) {
    const node = $pos.node(depth);
    if (isValid(node)) {
      parents.push(addProps<ExtendedNode>(node, {start: $pos.before(depth), depth: depth}));
    }
  }
  return parents;
}
