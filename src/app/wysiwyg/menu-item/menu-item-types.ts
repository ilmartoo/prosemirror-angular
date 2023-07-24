import {Command, EditorState} from 'prosemirror-state';
import {MARK_TYPES, NODE_TYPES} from '../text-editor/custom-schema';
import {Attrs, Mark, MarkType, NodeType} from 'prosemirror-model';
import {setBlockType, toggleMark} from 'prosemirror-commands';
import {
  activeMarksInSelectionEnd,
  areMarksEquals,
  areMarkTypesEquals,
  MarkForLookup,
  MarkTypeForLookup
} from '../utilities/marks-helper';
import {
  AncestorNode,
  ancestorNodesAtCursor,
  AncestorsList,
  areNodesEquals,
  areNodeTypesEquals,
  isListNode,
  NodeForLookup,
  NodeTypeForLookup
} from '../utilities/nodes-helper';
import {
  decreaseIndent,
  expandAndRemoveMarks,
  increaseIndent,
  insertContent,
  listCommands,
  replaceWithMarkedText,
  toggleWrapper
} from '../utilities/commands';
import {MenuItemActionPopupComponent} from './popups/menu-item-action-popup.component';
import {MenuItemPopupLinkComponent} from './popups/menu-item-popup-link.component';
import {MenuItemPopupImageComponent} from './popups/menu-item-popup-image.component';

/** Possible statuses of the menu item */
export enum MenuItemStatus {
  ENABLED = 'ENABLED',
  DISABLED = 'DISABLED',
  ACTIVE = 'ACTIVE',
  HIDDEN = 'HIDDEN',
}

/** Active marks and ancestor nodes at the cursor position */
export class CursorActiveElements {
  readonly marks: Mark[]; // TODO: Let it be an dictionary as { [markTypeName: string]: Mark[] } => Changes needed on mark-helper
  readonly ancestors: AncestorsList;

  private constructor(marks: Mark[], ancestors: AncestorsList) {
    this.marks = marks;
    this.ancestors = ancestors;
  }

  /**
   * Checks if the mark is active
   * @param mark Mark to check
   * @returns True if the mark is inside the active elements
   */
  hasMark(mark: MarkForLookup): boolean {
    return !!this.marks.find(m => areMarksEquals(m, mark));
  }

  /**
   * Checks if the mark type is active
   * @param type Mark type to check
   * @returns True if the mark type is inside the active elements
   */
  hasMarkType(type: MarkTypeForLookup): boolean {
    return !!this.marks.find(m => areMarkTypesEquals(m.type, type));
  }

  /**
   * Checks if the node is active
   * @param node Node to check
   * @returns True if the node is inside the active elements
   */
  hasNode(node: NodeForLookup): boolean {
    return !!this.ancestors.find(n => areNodesEquals(n, node));
  }

  /**
   * Checks if the node type is active
   * @param type Node type to check
   * @returns True if the node type is inside the active elements
   */
  hasNodeType(type: NodeTypeForLookup): boolean {
    return !!this.ancestors.find(n => areNodeTypesEquals(n.type, type));
  }

  /**
   * Returns the nearest ancestor that satisfies the condition
   * @param predicate Condition for the ancestor node to satisfy
   * @returns Nearest ancestor node that satisfies the condition or undefined if not found
   */
  firstAncestor(predicate: (node: AncestorNode) => boolean): AncestorNode | undefined {
    for (const ancestor of this.ancestors) {
      if (predicate(ancestor)) {
        return ancestor;
      }
    }
    return undefined;
  }

  /**
   * Creates a new CursorActiveElements from the given state
   * @param state Current state of the editor
   * @returns Instance of CursorActiveElements from the given state
   */
  static from(state: EditorState): CursorActiveElements {
    const marks = activeMarksInSelectionEnd(state);
    const ancestors = ancestorNodesAtCursor(state);
    return new CursorActiveElements(marks, ancestors);
  }
}

/** Type declaration of a menu item basic element action (When a type is not needed) */
export type MenuItemBasicAction = {
  /** Attrs generator for status & command calculation */
  attrs(data: { state: EditorState, attrs?: Attrs }): Attrs;
  /** Command to execute when clicked on the menu item */
  command(data: { state: EditorState, attrs?: Attrs }): Command;
  /** Status of the menu item on a given status */
  status(data: { state: EditorState, elements: CursorActiveElements, attrs?: Attrs }): MenuItemStatus;
}

/** Type declaration of a menu item type element action */
export type MenuItemTypeAction<
  T extends MarkType | NodeType = MarkType | NodeType,
  P extends MenuItemActionPopupComponent = MenuItemActionPopupComponent,
> = {
  /** Mark or node type of the menu item */
  type: T;
  /** Attrs generator for status & command calculation */
  attrs(data: { state: EditorState, attrs?: Attrs }): Attrs;
  /** Command to execute when clicked on the menu item */
  command(data: { state: EditorState, attrs?: Attrs }): Command;
  /** Status of the menu item on a given status */
  status(data: { state: EditorState, elements: CursorActiveElements, attrs?: Attrs }): MenuItemStatus;
  /** Optional popup compiled angular class type for a middle step */
  popup?: ({ new(...args: any[]): P });
}

export type MarkMenuItemActions =
  | 'link'
  | 'remove_link'
  | 'inline_code'
  | 'underline'
  | 'strikethrough'
  | 'color'
  | 'italic'
  | 'bold'
  | 'superscript'
  | 'subscript';
export type NodeMenuItemActions =
  | 'image'
  | 'blockquote'
  | 'indent'
  | 'deindent'
  | 'paragraph'
  | 'heading_1'
  | 'heading_2'
  | 'heading_3'
  | 'code_block'
  | 'ordered_list'
  | 'bullet_list'
  | 'check_list';
export type MenuItemTypes =
  { readonly [action in NodeMenuItemActions]: MenuItemTypeAction<NodeType> }
  & { readonly [action in MarkMenuItemActions]: MenuItemTypeAction<MarkType> };

/** List of predefined basic menu item types */
export const MENU_ITEM_TYPES: MenuItemTypes = {

  ///
  /// Marks
  ///
  link: {
    type: MARK_TYPES.link,
    attrs({ state, attrs }) {
      return {
        title: '',
        alt: '',
        href: '#',
        from: state.selection.from,
        ...attrs,
      };
    },
    command(data: { state: EditorState, attrs?: { title: string, href: string, from: number, to?: number } & Attrs }) {
      const {title, href, from, to} = this.attrs({ state: data.state, attrs: data.attrs });
      const link = this.type.create({title, href});
      return replaceWithMarkedText(title, [link], from, to)
    },
    status({state, elements, attrs}) {
      if (elements.hasMarkType(this.type)) { return MenuItemStatus.ACTIVE; }
      return this.command({state, attrs})(state) ? MenuItemStatus.ENABLED : MenuItemStatus.DISABLED;
    },
    popup: MenuItemPopupLinkComponent
  },

  remove_link: {
    type: MARK_TYPES.link,
    attrs({attrs}) { return attrs ?? {}; },
    command({state}) {
      return expandAndRemoveMarks(state!.selection.head, [this.type]);
    },
    status({state, attrs}) {
      return this.command({state, attrs})(state) ? MenuItemStatus.ENABLED : MenuItemStatus.HIDDEN;
    },
  },

  inline_code: {
    type: MARK_TYPES.code,
    attrs({attrs}) { return attrs ?? {}; },
    command(): Command {
      return toggleMark(this.type);
    },
    status({state, elements, attrs}) {
      return elements.hasMarkType(this.type) ? MenuItemStatus.ACTIVE
        : (this.command({state, attrs})(state) ? MenuItemStatus.ENABLED : MenuItemStatus.DISABLED);
    },
  },

  underline: {
    type: MARK_TYPES.underline,
    attrs({attrs}) { return attrs ?? {}; },
    command(): Command {
      return toggleMark(this.type);
    },
    status({state, elements, attrs}) {
      return elements.hasMarkType(this.type) ? MenuItemStatus.ACTIVE
        : (this.command({state, attrs})(state) ? MenuItemStatus.ENABLED : MenuItemStatus.DISABLED);
    },
  },

  strikethrough: {
    type: MARK_TYPES.strikethrough,
    attrs({attrs}) { return attrs ?? {}; },
    command(): Command {
      return toggleMark(this.type);
    },
    status({state, elements, attrs}) {
      return elements.hasMarkType(this.type) ? MenuItemStatus.ACTIVE
        : (this.command({state, attrs})(state) ? MenuItemStatus.ENABLED : MenuItemStatus.DISABLED);
    },
  },

  color: {
    type: MARK_TYPES.color,
    attrs({attrs}) { return attrs ?? {}; },
    command(): Command {
      return toggleMark(this.type);
    },
    status({state, elements, attrs}) {
      return elements.hasMarkType(this.type) ? MenuItemStatus.ACTIVE
        : (this.command({state, attrs})(state) ? MenuItemStatus.ENABLED : MenuItemStatus.DISABLED);
    },
  },

  italic: {
    type: MARK_TYPES.em,
    attrs({attrs}) { return attrs ?? {}; },
    command(): Command {
      return toggleMark(this.type);
    },
    status({state, elements, attrs}) {
      return elements.hasMarkType(this.type) ? MenuItemStatus.ACTIVE
        : (this.command({state, attrs})(state) ? MenuItemStatus.ENABLED : MenuItemStatus.DISABLED);
    },
  },

  bold: {
    type: MARK_TYPES.strong,
    attrs({attrs}) { return attrs ?? {}; },
    command(): Command {
      return toggleMark(this.type);
    },
    status({state, elements, attrs}) {
      return elements.hasMarkType(this.type) ? MenuItemStatus.ACTIVE
        : (this.command({state, attrs})(state) ? MenuItemStatus.ENABLED : MenuItemStatus.DISABLED);
    },
  },

  superscript: {
    type: MARK_TYPES.superscript,
    attrs({attrs}) { return attrs ?? {}; },
    command(): Command {
      return toggleMark(this.type);
    },
    status({state, elements, attrs}) {
      return elements.hasMarkType(this.type) ? MenuItemStatus.ACTIVE
        : (this.command({state, attrs})(state) ? MenuItemStatus.ENABLED : MenuItemStatus.DISABLED);
    },
  },

  subscript: {
    type: MARK_TYPES.subscript,
    attrs({attrs}) { return attrs ?? {}; },
    command(): Command {
      return toggleMark(this.type);
    },
    status({state, elements, attrs}) {
      return elements.hasMarkType(this.type) ? MenuItemStatus.ACTIVE
        : (this.command({state, attrs})(state) ? MenuItemStatus.ENABLED : MenuItemStatus.DISABLED);
    },
  },

  ///
  /// Nodes
  ///
  image: {
    type: NODE_TYPES.image,
    attrs({ attrs}) {
      return {
        title: '',
        src: '',
        ...attrs,
      }
    },
    command(data: { state: EditorState, attrs?: { title: string, alt: string, src: string } & Attrs }): Command {
      const {title, alt, src} = this.attrs({ state: data.state, attrs: data.attrs });
      const image = this.type.create({title, alt, src});
      return insertContent(data.state!.selection.head, image);
    },
    status({state, attrs}): MenuItemStatus {
      return this.command({state, attrs}) ? MenuItemStatus.ENABLED : MenuItemStatus.DISABLED;
    },
    popup: MenuItemPopupImageComponent,
  },

  blockquote: {
    type: NODE_TYPES.blockquote,
    attrs({attrs}) { return attrs ?? {}; },
    command(): Command {
      return toggleWrapper(this.type)
    },
    status({state, elements, attrs}): MenuItemStatus {
      return elements.hasNodeType(this.type) ? MenuItemStatus.ACTIVE
        : (this.command({state, attrs})(state) ? MenuItemStatus.ENABLED : MenuItemStatus.DISABLED);
    },
  },

  indent: {
    type: NODE_TYPES.indent,
    attrs({attrs}) { return attrs ?? {}; },
    command(): Command {
      return increaseIndent;
    },
    status({state, attrs}): MenuItemStatus {
      return this.command({state, attrs})(state) ? MenuItemStatus.ENABLED : MenuItemStatus.DISABLED;
    },
  },

  deindent: {
    type: NODE_TYPES.indent,
    attrs({attrs}) { return attrs ?? {}; },
    command(): Command {
      return decreaseIndent;
    },
    status({state, attrs}): MenuItemStatus {
      return this.command({state, attrs})(state) ? MenuItemStatus.ENABLED : MenuItemStatus.DISABLED;
    },
  },

  paragraph: {
    type: NODE_TYPES.paragraph,
    attrs({attrs}) { return attrs ?? {}; },
    command(): Command {
      return setBlockType(this.type);
    },
    status({state, elements, attrs}): MenuItemStatus {
      return elements.hasNodeType(this.type) ? MenuItemStatus.ACTIVE
        : (this.command({state, attrs})(state) ? MenuItemStatus.ENABLED : MenuItemStatus.DISABLED);
    },
  },

  heading_1: heading_action(1),
  heading_2: heading_action(2),
  heading_3: heading_action(3),

  code_block: {
    type: NODE_TYPES.code_block,
    attrs({attrs}) { return attrs ?? {}; },
    command(): Command {
      return setBlockType(this.type);
    },
    status({state, elements, attrs}): MenuItemStatus {
      return elements.hasNodeType(this.type) ? MenuItemStatus.ACTIVE
        : (this.command({state, attrs})(state) ? MenuItemStatus.ENABLED : MenuItemStatus.DISABLED);
    },
  },

  ordered_list: {
    type: NODE_TYPES.ordered_list,
    attrs({attrs}) { return attrs ?? {}; },
    command(): Command {
      return listCommands(this.type);
    },
    status({state, elements, attrs}): MenuItemStatus {
      const isCurrentType = areMarkTypesEquals(elements.firstAncestor(isListNode)?.type, this.type);
      return isCurrentType ? MenuItemStatus.ACTIVE
        : (this.command({state, attrs})(state) ? MenuItemStatus.ENABLED : MenuItemStatus.DISABLED);
    },
  },

  bullet_list: {
    type: NODE_TYPES.bullet_list,
    attrs({attrs}) { return attrs ?? {}; },
    command(): Command {
      return listCommands(this.type);
    },
    status({state, elements, attrs}): MenuItemStatus {
      const isCurrentType = areMarkTypesEquals(elements.firstAncestor(isListNode)?.type, this.type);
      return isCurrentType ? MenuItemStatus.ACTIVE
        : (this.command({state, attrs})(state) ? MenuItemStatus.ENABLED : MenuItemStatus.DISABLED);
    },
  },

  check_list: {
    type: NODE_TYPES.check_list,
    attrs({attrs}) { return attrs ?? {}; },
    command(): Command {
      return listCommands(this.type);
    },
    status({state, elements, attrs}): MenuItemStatus {
      const isCurrentType = areMarkTypesEquals(elements.firstAncestor(isListNode)?.type, this.type);
      return isCurrentType ? MenuItemStatus.ACTIVE
        : (this.command({state, attrs})(state) ? MenuItemStatus.ENABLED : MenuItemStatus.DISABLED);
    },
  },
}
// CREATE_TABLE: {
//   type: NODE_TYPES.table,
//   command({ state, attrs }): Command {},
//   status({ state, elements, attrs }): MenuItemStatus {},
// },
//
// REMOVE_TABLE: {
//
// },
//
// CREATE_TABLE_ROW: {
//   type: NODE_TYPES.table_row,
//   command({ state, attrs }): Command {},
//   status({ state, elements, attrs }): MenuItemStatus {},
// },
//
// REMOVE_TABLE_ROW: {
//   type: NODE_TYPES.table_row,
//   command({ state, attrs }): Command {},
//   status({ state, elements, attrs }): MenuItemStatus {},
// },
//
// HEADER: {
//   type: NODE_TYPES.table_header,
//   command({ state, attrs }): Command {},
//   status({ state, elements, attrs }): MenuItemStatus {},
// }

// Heading action function
function heading_action(level: number): MenuItemTypeAction<NodeType> {
  const attrs = { level };
  return {
    type: NODE_TYPES.heading,
    attrs({attrs}) { return attrs ?? {}; },
    command(): Command {
      return setBlockType(this.type, attrs);
    },
    status({state, elements}): MenuItemStatus {
      return elements.hasNode({type: this.type, attrs}) ? MenuItemStatus.ACTIVE
        : (this.command({state, attrs})(state) ? MenuItemStatus.ENABLED : MenuItemStatus.DISABLED);
    },
  }
}
