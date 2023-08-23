/**
 * Custom ProseMirror helper functions for Node management
 */

import {Attrs, Node as ProseNode, NodeRange, NodeType, ResolvedPos} from "prosemirror-model";
import {EditorState} from "prosemirror-state";
import {addProps, areEquals, FilterKeys, filterProps} from "./multipurpose-helper";
import {NodeGroups} from '../text-editor/custom-schema';

/** Alias for the needed Node elements to perform a ProseMirrorHelper node lookup */
export type NodeForLookup = ProseNode | { type: { name: string }, attrs?: Attrs };
/** Alias for the needed NodeType elements to perform a ProseMirrorHelper node type lookup */
export type NodeTypeForLookup = NodeType | { name: string };
/** Node data & position for helper functions */
export type ExtendedNode = ProseNode & {
  /** Position right before the start of the node. Before the content. */
  readonly before: number,
  /** Position at the start of the node. First position of the content. */
  readonly start: number,
  /** Position at the end of the node. Last position of the content. */
  readonly end: number,
  /** Position right after the end of the node. After the content. */
  readonly after: number,
  /** Depth of the node */
  readonly depth: number,
  /** Size of the node */
  get size(): number;
};
/** Ancestor of a node */
export type AncestorNode = ExtendedNode & {
  /** Parent of the node */
  readonly parent?: AncestorNode,
};

/** List to display & relate ancestors of a node */
export class AncestorsList extends Array<AncestorNode> {

  constructor(...ancestors: ExtendedNode[]) {
    super();
    super.push(...AncestorsList.link(ancestors));
  }

  /**
   * Appends the ancestors to the end of the ancestor list, making the last one the parent of the last ancestor appended
   * @param ancestors Ancestor nodes to append
   * @returns Updated length of the ancestor list
   */
  override push(...ancestors: ExtendedNode[]): number {
    super.push(...AncestorsList.link(ancestors));
    return this.length;
  }

  override unshift(...ancestors: ExtendedNode[]): number {
		super.unshift(...AncestorsList.link(ancestors), this[0]);
		return this.length;
	}

	/**
   * Links the array of nodes as ancestors by the order established in the array --> [1] will be the parent of [0] and so on
   * @param ancestors Array of ancestors
   * @param last Node to link from the last ancestor
   * @returns Array of linked ancestors
   * @private
   */
  private static link(ancestors: ExtendedNode[], last?: AncestorNode): AncestorNode[] {
    const linkedAncestors: AncestorNode[] = [];

    for (let i = 0; i < ancestors.length; i++) {
      linkedAncestors.push(addProps<AncestorNode>(ancestors[i], {parent: ancestors[i + 1] ?? last}));
    }

    return linkedAncestors;
  }

  /**
   * Creates an empty ancestor node list
   * @returns Empty instance of AncestorNodeList
   */
  static get EMPTY() {
    return new AncestorsList();
  }
}

/**
 * Extends the node
 * @param node Node to extend
 * @param $pos Position contained in the node
 * @param depth Depth of the node
 * @returns Reference to the extended node for chaining
 */
export function extendNode(node: ProseNode, $pos: ResolvedPos, depth: number = $pos.depth): ExtendedNode {
  const extendedNodeRef = node as ExtendedNode;
  return addProps<ExtendedNode>(node, {
    before: depth < 1 ? $pos.start(depth) : $pos.before(depth),
    start: $pos.start(depth),
    end: $pos.end(depth),
    after: depth < 1 ? $pos.end(depth) : $pos.after(depth),
    depth: depth,
    get size() { return extendedNodeRef.before + extendedNodeRef.nodeSize; },
  });
}

/**
 * Retrieves a list of all the ancestor nodes at a given position
 * @param $pos Position to get all the ancestors from
 * @param startDepth Initial depth from which the lookup will start
 * @returns List of all ancestors at the given position
 */
export function ancestorNodesAt($pos: ResolvedPos, startDepth?: number): AncestorsList {
  return findAllAncestors($pos, () => true, startDepth);
}

/**
 * Retrieves all ancestor nodes from a range
 * @param range Range to retrieve the ancestors from
 * @returns List of the ancestor nodes of the range
 */
export function ancestorNodesInRange(range: NodeRange): AncestorsList {
  return ancestorNodesAt(range.$from, range.depth);
}

/**
 * Gets ancestor nodes for the current cursor position
 * @param state State of the editor
 * @return Ancestor nodes at cursor position
 */
export function ancestorNodesAtCursor(state: EditorState): AncestorsList {
  const ancestorsAtCursor = ancestorNodesAt(state.selection.$to);

  // Ad-Hoc for atom nodes
  const atomNode = isAtomNodeBetween(state.selection.$from, state.selection.$to);
  if (atomNode) {
		ancestorsAtCursor.unshift(atomNode);
  }

  return ancestorsAtCursor;
}

/**
 * Gets all ancestor nodes for the current selection (removing duplicate node types)
 * @param state State of the editor
 * @return Array of active nodes
 */
export function ancestorNodesInSelection(state: EditorState): AncestorsList {
  const isEmpty = state.selection.empty;

  if (isEmpty) {
    return ancestorNodesAtCursor(state);
  } else {
    const range = state.selection.$from.blockRange(state.selection.$to);
    if (!range) { return AncestorsList.EMPTY; }
    return ancestorNodesInRange(range);
  }
}

/**
 * Checks if two nodes are the same (taking into account attrs)
 * @param a Node a
 * @param b Node b
 * @param filter Keys to filter by
 * @returns True if nodes are the same
 */
export function areNodesEquals(
  a?: NodeForLookup,
  b?: NodeForLookup,
  filter?: FilterKeys<Attrs>
): boolean {
  const attrsA = filterProps<Attrs>(a?.attrs, filter);
  const attrsB = filterProps<Attrs>(b?.attrs, filter);
  return areNodeTypesEquals(a?.type, b?.type) && areEquals<Attrs>(attrsA, attrsB);
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
                             isValid: (node: ProseNode, depth: number) => boolean,
                             startDepth: number = $pos.depth): ExtendedNode | undefined {
  for (let depth = startDepth; depth >= 0; depth--) {
    const node = $pos.node(depth);
    if (isValid(node, depth)) {
      return extendNode(node, $pos, depth);
    }
  }
  return undefined;
}

/**
 * Searches for the closest ancestor node of the given type
 * @param $pos Starting position for ancestor lookup
 * @param type Node type to look for
 * @param startDepth Starting depth to check from (default is $pos.depth)
 * @returns Ancestor node of the given type or undefined if not found
 */
export function findAncestorOfType($pos: ResolvedPos, type: NodeTypeForLookup, startDepth?: number): ExtendedNode | undefined {
  return findAncestor($pos, (node: ProseNode) => areNodeTypesEquals(node.type, type), startDepth);
}

/**
 * Searches for all the ancestor nodes that satisfies the given condition
 * @param $pos Starting position for ancestor lookup
 * @param isValid Function to check if ancestor is valid
 * @param startDepth Starting depth to check from (default is $pos.depth)
 * @returns Ancestor nodes that satisfies the condition or empty array if none found
 */
export function findAllAncestors($pos: ResolvedPos,
                                 isValid: (node: ProseNode, depth: number) => boolean,
                                 startDepth: number = $pos.depth): AncestorsList {
  const parents = new AncestorsList();
  for (let depth = startDepth; depth >= 0; depth--) {
    const node = $pos.node(depth);
    if (isValid(node, depth)) {
      parents.push(extendNode(node, $pos, depth));
    }
  }
  return parents;
}

/**
 * Retrieves the ancestor node at the given position with the given depth
 * @param $pos Position for the ancestor retrieval
 * @param depth Depth of the ancestor
 * @returns Ancestor node at the given depth
 */
export function ancestorAt($pos: ResolvedPos, depth: number): ExtendedNode {
  return extendNode($pos.node(depth), $pos, depth);
}

/**
 * Retrieves all child nodes from the range parent node contained inside the range
 * @param range Range to get the nodes from
 * @returns List of child nodes inside the range
 */
export function childNodesInRange(range: NodeRange): ExtendedNode[] {
  const children: ExtendedNode[] = [];
  const parent = range.parent;
  const basePos = range.$from.start(range.depth);

  parent.forEach((node, offset) => {
    if (basePos + offset <= range.$to.pos) {
      children.push(extendNode(node, parent.resolve(offset), range.depth + 1));
    }
  });

  return children;
}

/**
 * Checks if given node is a list node
 * @param node Node to check
 * @returns True if the node is a list node
 */
export function isListNode(node: ProseNode): boolean {
  return !!node.type.spec.group?.includes(NodeGroups.LIST);
}

/**
 * Checks if given node is alignable
 * @param node Node to check
 * @returns True if the node is alignable
 */
export function isAlignableNode(node: ProseNode): boolean {
  return !!node.type.spec.group?.includes(NodeGroups.ALIGNABLE);
}

/**
 * Finds a node between the positions that satisfies the given condition
 * @param $from Starting position for lookup
 * @param $to Finish position for lookup
 * @param isValid Function to check if the child is valid
 * @returns Child node that satisfies the condition or undefined if not found
 */
export function findNodeBetween($from: ResolvedPos, $to: ResolvedPos, isValid: (node: ProseNode, pos: number) => boolean): ExtendedNode | undefined {
  const resolve = (pos: number) => $from.doc.resolve(pos);

  for (let pos = $from.pos; pos <= $to.pos; pos++) {
    const $pos = resolve(pos);
    const node = $pos.node();

    // If node is valid, return it
    if (isValid(node, pos)) {
      return extendNode(node, $pos);
    }

    // Skip other positions of the node
    if (node.childCount === 0) {
      pos += node.nodeSize - 1;
    }
  }
  return undefined;
}

/**
 * Finds a node between the positions that satisfies the given condition
 * @param $from Starting position for lookup
 * @param $to Finish position for lookup
 * @param isValid Function to check if the child is valid
 * @returns Child node that satisfies the condition or undefined if not found
 */
export function findAllNodesBetween($from: ResolvedPos, $to: ResolvedPos, isValid: (node: ProseNode, pos: number) => boolean): ExtendedNode[] {
  const nodes: ExtendedNode[] = [];
  const resolve = (pos: number) => $from.node(0).resolve(pos);

  $from.doc.nodesBetween($from.pos, $to.pos, (node, pos) => {
    if (isValid(node, pos)) {
      nodes.push(extendNode(node, resolve(pos)));
    }
  });
  return nodes;
}

/**
 * Checks if an atom node is strictly between the positions given
 * @param $from Start position
 * @param $to End position
 * @returns The atom node between the positions or undefined if none exists
 */
export function isAtomNodeBetween($from: ResolvedPos, $to: ResolvedPos): ExtendedNode | undefined {
  if ($from.pos > $to.pos) { return isAtomNodeBetween($to, $from); } // In case of accidental misuse
  const sameNode = $from.nodeAfter === $to.nodeBefore;
  const selectedNode = sameNode ? $from.nodeAfter : null;
  if (selectedNode && selectedNode.type.spec.atom) {
   return extendNode(selectedNode, $from.doc.resolve($from.pos + 1));
  }
  return undefined;
}
