import {Decoration, DecorationSet} from 'prosemirror-view';
import {EditorState, Plugin} from 'prosemirror-state';
import {Attrs, Mark, MarkType, Node as ProseNode, NodeRange, NodeType, ResolvedPos} from 'prosemirror-model';


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
 * Class that defines some methods to help with the management of ProseMirror elements
 */
export class ProseMirrorHelper {

  /**
   * Retrieves all active marks in any subsection of the document range
   * @param node Editor node to be used for the mark lookup
   * @param start Starting position (inclusive)
   * @param end End position (inclusive)
   * @returns List of all active marks
   */
  static activeMarksInRange(node: ProseNode, start: number, end: number): Mark[] {
    if (start > end) {
      return this.activeMarksInRange(node, end, start);
    }

    const activeMarks = new Set<Mark>();

    for (let i = start; i <= end; i++) {
      node.resolve(i).marks().forEach((mark) => activeMarks.add(mark));
    }

    return Array.from(activeMarks);
  }

  /**
   * Retrieves all parent nodes in any subsection of the document range
   * @param node Editor node to be used for the mark lookup
   * @param start Starting position (inclusive)
   * @param end End position (inclusive)
   * @returns List of all parent nodes
   */
  static parentNodesInRange(node: ProseNode, start: number, end: number): ProseNode[] {
    if (start > end) {
      return this.parentNodesInRange(node, end, start);
    }

    const presentNodes = new Set<ProseNode>();

    for (let i = start; i <= end; i++) {
      presentNodes.add(node.resolve(i).parent);
    }

    return Array.from(presentNodes);
  }

  /**
   * Gets active marks for the current cursor position
   * @param state State of the editor
   * @return Array of active marks
   */
  static activeMarksInCursorPosition(state: EditorState): Mark[] {
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
   * Gets parent node for the current cursor position
   * @param state State of the editor
   * @return Parent node
   */
  static parentNodeInCursorPosition(state: EditorState): ProseNode {
    return state.selection.$from.parent;
  }

  /**
   * Gets active marks for the current selection
   * @param state State of the editor
   * @return Array of active marks
   * @private
   */
  static activeMarksInSelection(state: EditorState): Mark[] {
    const isEmpty = state.selection.empty;

    if (isEmpty) {
      return this.activeMarksInCursorPosition(state);
    }
    else {
      const $head = state.selection.$head; // Dynamic end of the selection
      const $anchor = state.selection.$anchor; // Static end of the selection

      const $range = $anchor.blockRange($head) as NodeRange; // It will not be null because it is checked beforehand

      return this.activeMarksInRange(state.doc, $range.start, $range.end);
    }
  }

  /**
   * Gets all parent nodes for the current selection
   * @param state State of the editor
   * @return Array of active nodes
   */
  static parentNodesInSelection(state: EditorState): ProseNode[] {
    const isEmpty = state.selection.empty;

    if (isEmpty) {
      return [this.parentNodeInCursorPosition(state)];
    }
    else {
      const $head = state.selection.$head; // Dynamic end of the selection
      const $anchor = state.selection.$anchor; // Static end of the selection

      const $range = $anchor.blockRange($head) as NodeRange; // It will not be null because it is checked beforehand

      return this.parentNodesInRange(state.doc, $range.start, $range.end);
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
  static searchForMarkTypeInRange(type: MarkTypeForLookup, node: ProseNode, start: number, end: number): { resolvedPos: ResolvedPos, mark: Mark } | undefined {
    if (start > end) {
      return this.searchForMarkTypeInRange(type, node, end, start);
    }

    for (let i = start; i <= end; i++) {
      const resolvedPos = node.resolve(i);
      const mark = this.isMarkTypeActiveAt(type, resolvedPos);
      if (mark) {
        return { resolvedPos, mark };
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
  static searchForMarkTypeInSelection(type: MarkTypeForLookup, state: EditorState): { resolvedPos: ResolvedPos, mark: Mark } | undefined {
    return this.searchForMarkTypeInRange(type, state.doc, state.selection.from, state.selection.to);
  }

  /**
   * Calculates the active range of a mark inside a node by expanding both sides starting from a given position
   * @param node Node in which the search will be done
   * @param mark Mark to look for
   * @param position Start position from which the range will be expanded
   * @returns Active range of the given mark in the given node including the given position
   */
  static expandMarkActiveRange(node: ProseNode, mark: MarkForLookup, position: number): NodeRange | null {
    const hasMark = (pos: number): boolean => !!this.isMarkActiveInNodeAt(mark, node, pos);

    // Check if
    if (!hasMark(position)) {
      return null;
    }

    // Start position
    let start = position;
    while (start > 0) {
      if (!hasMark(start - 1)) { break; }
      start--;
    }

    // End position
    let end = position;
    const docEnd = node.nodeSize - 1;
    while (end < docEnd) {
      if (!hasMark(end + 1)) { break; }
      end++;
    }

    // Mark expanded range
    const startPos = node.resolve(start);
    const endPos = node.resolve(end);
    return startPos.blockRange(endPos);
  }

  /**
   * Retrieves mark if is the same type and active at a position
   * @param type Mark type to check
   * @param pos Document resolved position to check
   * @returns Mark reference of the active mark at the given position or undefined if inactive
   */
  static isMarkTypeActiveAt(type: MarkTypeForLookup, pos: ResolvedPos): Mark | undefined {
    return pos.marks().find(m => m.type.name === type.name);
  }

  /**
   * Retrieves mark if is active at a position of a node
   * @param type Mark type to check
   * @param node Node on which the check will be performed
   * @param pos Document raw position to check
   * @returns Mark reference of the active mark at the given position of the node or undefined if inactive
   */
  static isMarkTypeActiveInNodeAt(type: MarkTypeForLookup, node: ProseNode, pos: number): Mark | undefined {
    return this.isMarkTypeActiveAt(type, node.resolve(pos));
  }

  /**
   * Retrieves mark if is active at a position
   * @param mark Mark to check
   * @param pos Document resolved position to check
   * @returns Mark reference of the active mark at the given position or undefined if inactive
   */
  static isMarkActiveAt(mark: MarkForLookup, pos: ResolvedPos): Mark | undefined {
    const activeMark = this.isMarkTypeActiveAt(mark.type, pos);
    return this.areMarksEquals(mark, activeMark) ? activeMark : undefined;
  }

  /**
   * Retrieves mark if is active at a position of a node
   * @param mark Mark to check
   * @param node Node on which the check will be performed
   * @param pos Document raw position to check
   * @returns Mark reference of the active mark at the given position of the node or undefined if inactive
   */
  static isMarkActiveInNodeAt(mark: MarkForLookup, node: ProseNode, pos: number): Mark | undefined {
    return this.isMarkActiveAt(mark, node.resolve(pos));
  }

  /**
   * Checks if two nodes are the same (taking into account attrs)
   * @param a Node a
   * @param b Node b
   * @returns True if nodes are the same
   */
  static areNodesEquals(a?: NodeForLookup, b?: NodeForLookup): boolean {
    return this.areNodeTypesEquals(a?.type, b?.type) && this.areEquals<Attrs>(a?.attrs, b?.attrs);
  }

  /**
   * Checks if two node types are the same
   * @param a Node type a
   * @param b Node type b
   * @returns True if node types are the same
   */
  static areNodeTypesEquals(a?: NodeTypeForLookup, b?: NodeTypeForLookup): boolean {
    return a?.name === b?.name;
  }

  /**
   * Checks if two marks are the same (taking into account attrs)
   * @param a Mark a
   * @param b Mark b
   * @returns True if marks are the same
   */
  static areMarksEquals(a?: MarkForLookup, b?: MarkForLookup): boolean {
    return this.areMarkTypesEquals(a?.type, b?.type) && this.areEquals<Attrs>(a?.attrs, b?.attrs);
  }

  /**
   * Checks if two mark types are the same
   * @param a Mark type a
   * @param b Mark type b
   * @returns True if mark types are the same
   */
  static areMarkTypesEquals(a?: MarkTypeForLookup, b?: MarkTypeForLookup): boolean {
    return a?.name === b?.name;
  }

  /**
   * Equality comparator between objects
   * @param a Object a
   * @param b Object b
   * @returns True if objects
   */
  static areEquals<T = any>(a?: T, b?: T): boolean {
    // Null check
    if (a == null || b == null) {
      return a == b;
    }

    // False if different types
    if (typeof(a) !== typeof(b)) {
      return false;
    }

    // Object check
    if (typeof(a) === 'object') {
      // False if not the same number of keys
      const aSize = Object.keys(a).length;
      const bSize = Object.keys(b).length;
      if (aSize !== bSize) {
        return false;
      }

      // Check every key
      for (const key in a) {

        // Check for equality on child elements
        if (!this.areEquals(a[key], b[key])) {
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

  // Decorators ////////////////////////////////////////////////////////////////////////////////////////////////////////
  static currentElementDecorator(): Plugin {
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

  static selectedNodesDecorator(): Plugin {
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
}
