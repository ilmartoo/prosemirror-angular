import {Decoration, DecorationSet} from 'prosemirror-view';
import {EditorState, Plugin, TextSelection, Transaction} from 'prosemirror-state';
import {Attrs, Fragment, Mark, MarkType, Node as ProseNode, NodeRange, NodeType, ResolvedPos} from 'prosemirror-model';

///
/// Prosemirror helper functions, types & classes
///

/// Multipurpose //////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Adds the given props to the given object
 * @param item Object to which props will be added
 * @param props Properties to add
 * @returns Reference to the given object with the updated props for chaining
 */
export function addProps<T extends object = object>(item: object, props: { [p in keyof T]?: any }): T {
  const ref = item as { [p in keyof T]: any };
  for (let prop in props) {
    ref[prop] = props[prop];
  }
  return item as T;
}

/**
 * Equality comparator between objects
 * @param a Object a
 * @param b Object b
 * @returns True if objects
 */
export function areEquals<T = any>(a?: T, b?: T): boolean {
  // Null check
  if (a == null || b == null) {
    return a == b;
  }

  // False if different types
  if (typeof (a) !== typeof (b)) {
    return false;
  }

  // Object check
  if (typeof (a) === 'object') {
    // False if not the same number of keys
    const aSize = Object.keys(a).length;
    const bSize = Object.keys(b).length;
    if (aSize !== bSize) {
      return false;
    }

    // Check every key
    for (const key in a) {

      // Check for equality on child elements
      if (!areEquals(a[key], b[key])) {
        return false;
      }
    }

    return true;
  }

  // Equality check for non object types
  else {
    return a === b;
  }
}


/// Base helper ////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Alias for the needed Mark elements to perform a ProseMirrorHelper mark lookup
 */
export type MarkForLookup = Mark | { type: { name: string }, attrs?: Attrs };
/**
 * Alias for the needed MarkType elements to perform a ProseMirrorHelper mark type lookup
 */
export type MarkTypeForLookup = MarkType | { name: string };
/**
 * Alias for the needed Node elements to perform a ProseMirrorHelper node lookup
 */
export type NodeForLookup = ProseNode | { type: { name: string }, attrs?: Attrs };
/**
 * Alias for the needed NodeType elements to perform a ProseMirrorHelper node type lookup
 */
export type NodeTypeForLookup = NodeType | { name: string };
/**
 * Mark data & position for helper functions
 */
export type ExtendedMark = Mark & { pos: number };
/**
 * Node data & position for helper functions
 */
export type ExtendedNode = ProseNode & { start: number, depth: number };
/**
 * Ancestor of a node
 */
export type AncestorNode = ExtendedNode & { parent?: AncestorNode };
/**
 * List to display & relate ancestors of a node
 */
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
      linkedAncestors.push(addProps<AncestorNode>(ancestors[0], { parent: undefined }));

      for (let i = 1; i < ancestors.length; i++) {
        linkedAncestors.push(addProps<AncestorNode>(ancestors[i], { parent: undefined }));
        linkedAncestors[i - 1].parent = linkedAncestors[i];
      }
    }

    return linkedAncestors;
  }
}

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
export function activeMarksInCursorPosition(state: EditorState): Mark[] {
  const storedMarks = state.storedMarks;
  const $from = state.selection.$from;

  // Return either the stored marks, or the marks at the cursor position.
  // Note:
  //   Stored marks are the marks that are going to be applied to the next
  //   input if you dispatched a mark toggle with an empty cursor.
  const activeMarks = storedMarks ?? $from.marks();
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
    return activeMarksInCursorPosition(state);
  }
  else {
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
export function searchForMarkTypeInRange(type: MarkTypeForLookup, node: ProseNode, start: number, end: number): ExtendedMark | undefined {
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
  return mark ? addProps<ExtendedMark>(mark, { pos: $pos.pos }) : undefined;
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
  return new NodeRange(startPos, endPos, 1);
}

/**
 * Retrieves mark if is active at a position of a node
 * @param type Mark type to check
 * @param node Node on which the check will be performed
 * @param pos Document raw position to check
 * @returns Mark reference of the active mark at the given position of the node or undefined if inactive
 */
export function isMarkTypeActiveInNodeAt(type: MarkTypeForLookup, node: ProseNode, pos: number): ExtendedMark | undefined {
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
 * Retrieves a list of all the ancestor nodes at a given position
 * @param $pos Position to get all the ancestors from
 * @returns List of all ancestors at the given position
 */
export function ancestorNodesAt($pos: ResolvedPos): ExtendedNode[] {
  const parents: ExtendedNode[] = [];
  for (let depth = $pos.depth; depth > 0; depth--) {
    parents.push(addProps<ExtendedNode>($pos.node(depth), { start: $pos.start(depth), depth: depth }))
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
export function ancestorNodesInCursorPosition(state: EditorState): ExtendedNode[] {
  return ancestorNodesAt(state.selection.$from);
}

/**
 * Gets all ancestor nodes for the current selection (removing duplicate node types)
 * @param state State of the editor
 * @return Array of active nodes
 */
export function ancestorNodesInSelection(state: EditorState): ExtendedNode[] {
  const isEmpty = state.selection.empty;

  if (isEmpty) {
    return ancestorNodesInCursorPosition(state);
  }
  else {
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
 * Checks if two marks are the same (taking into account attrs)
 * @param a Mark a
 * @param b Mark b
 * @returns True if marks are the same
 */
export function areMarksEquals(a?: MarkForLookup, b?: MarkForLookup): boolean {
  return areMarkTypesEquals(a?.type, b?.type) && areEquals<Attrs>(a?.attrs, b?.attrs);
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
 * Returns the text contained in the node
 * - If from and to are given, the text between these positions is returned
 * - If only from is given, the text between from and the end of the node is returned
 * - If none are given, all the text from the node is returned
 * @param node Node to get the text from
 * @param from Start of the range
 * @param to End of the range
 * @returns Text contained in the range specified or all the text from the node if no range given
 */
export function textAt(node: ProseNode, from?: number, to?: number): string {
  if (from) {
    return to ? node.textBetween(from, to, '\n') : node.textBetween(from, node.content.size);
  }
  else {
    return node.textBetween(0, node.content.size, '\n');
  }
}

/**
 * Searches for the closest ancestor node that satisfies the given condition
 * @param $pos Starting position for ancestor lookup
 * @param isValid Function to check if ancestor is valid
 * @param startDepth Starting depth to check from (default is $pos.depth)
 * @returns Ancestor node that satisfies the condition or undefined if not found
 */
export function findAncestor($pos: ResolvedPos, isValid: (node: ProseNode) => boolean, startDepth?: number): AncestorNode | undefined {
  for (let depth = startDepth ?? $pos.depth; depth >= 0; depth--) {
    const node = $pos.node(depth);
    if (isValid(node)) {
      return addProps<AncestorNode>(node, { start: $pos.before(depth), depth: depth });
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
export function findAllAncestors($pos: ResolvedPos, isValid: (node: ProseNode) => boolean, startDepth?: number): AncestorNodeList {
  const parents = new AncestorNodeList();
  for (let depth = startDepth ?? $pos.depth; depth >= 0; depth--) {
    const node = $pos.node(depth);
    if (isValid(node)) {
       parents.push(addProps<ExtendedNode>(node, { start: $pos.before(depth), depth: depth }));
    }
  }
  return parents;
}

/**
 * Checks if content is valid for given node type
 * @param base Node type
 * @param content Content to check if valid
 * @returns True if content is valid inside given node type
 */
export function isValidContent(base: NodeType, content?: Fragment | ProseNode | readonly ProseNode[] | null): boolean {
  return base.validContent(Fragment.from(content));
}


// Transactions /////////////////////////////////////////////////////////////////////////////////////////////////////

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
}

/**
 * Creates an extended transaction from a basic transaction
 * @param tr Transaction to extend
 * @returns Reference to the given transaction with the extended props
 */
export function extendTransaction(tr: Transaction): ExtendedTransaction {
  return addProps<ExtendedTransaction>(tr, {
    mapAndResolveResolvedPos: ($pos: ResolvedPos): ResolvedPos => mapAndResolveResolvedPos(tr, $pos),
    mapAndResolvePos: (pos: number): ResolvedPos => mapAndResolvePos(tr, pos),
    unwrapNode: (node: ExtendedNode): ExtendedTransaction => unwrapNode(tr, node) as ExtendedTransaction,
  })
}

/**
 * Maps the given resolved pos to a new resolved pos in the changed document
 * @param tr Transaction with the changed document
 * @param $pos Resolved position to be mapped
 * @returns Mapped position to the changed document
 */
export function mapAndResolveResolvedPos(tr: Transaction | ExtendedTransaction, $pos: ResolvedPos): ResolvedPos {
  return mapAndResolvePos(tr, $pos.pos);
}

/**
 * Maps the given pos to a new resolved pos in the changed document
 * @param tr Transaction with the changed document
 * @param pos Position to be mapped
 * @returns Mapped position to the changed document
 */
export function mapAndResolvePos(tr: Transaction | ExtendedTransaction, pos: number): ResolvedPos {
  return tr.doc.resolve(tr.mapping.map(pos));
}

// TODO: Replace this with a custom step representing this function to correctly map the positions?
/**
 * Unwraps the content of the given node, mapping the selection accordingly
 * @param tr Transaction
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


// Decorators ////////////////////////////////////////////////////////////////////////////////////////////////////////
export function currentElementDecorator(): Plugin {
  return new Plugin({
    props: {
      decorations(state) {
        const selection = state.selection;

        const resolved = state.doc.resolve(selection.from);
        const decoration = Decoration.node(resolved.before(), resolved.after(), {class: 'current-element'});
        // This is equivalent to:
        // const decoration = Decoration.node(resolved.start() - 1, resolved.end() + 1, {class: 'current-element'});
        return DecorationSet.create(state.doc, [decoration]);
      }
    }
  })
}

export function selectedNodesDecorator(): Plugin {
  return new Plugin({
    props: {
      decorations(state) {
        const selection = state.selection;
        const decorations: Decoration[] = [];

        state.doc.nodesBetween(selection.from, selection.to, (node, position) => {
          if (node.isBlock) {
            decorations.push(Decoration.node(position, position + node.nodeSize, {class: 'selection'}));
          }
        });

        return DecorationSet.create(state.doc, decorations);
      }
    }
  })
}


// Groups & Content management //////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates a concatenation from multiple group strings
 * @param groups Array of group strings
 * @returns String of a concatenated group expression
 */
export function groupChain(...groups: string[]): string {
  return groups.join(' ');
}

/**
 * Creates a group OR expression from two or more groups
 * @param groupA First group string to OR
 * @param groups Group strings to OR
 * @returns String of an OR group expression as `(item_a | item_b [| item_c...])`
 */
export function groupOr(groupA: string, ...groups: string[]): string {
  return `(${groupA}|${groups.join('|')})`;
}

/**
 * Creates a repeated group string
 * @param group Group string to repeat
 * @param rep Number of repetitions [1, Inf)
 * @returns String of a repeat group expression
 */
export function groupRepeat(group: string, rep: number): string {
  if (rep > 0) { return `${group}{${rep}}`; }
  return '';
}

/**
 * Creates a ranged group string
 * @param group Group to range
 * @param min Minimum repetitions of the group
 * @param max Maximum repetitions of the group
 * @returns String of a ranged group expression
 */
export function groupRange(group: string, min: number, max?: number): string {
  if (max && min <= max) { return `${group}{${min},${max ?? ''}}`; }
  if (min >= 0) { return min > 1 ? `${group}{${min},}` : (min === 0 ? `${group}*` : `${group}+`); }
  return '';
}
