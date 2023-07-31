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
  changeBackgroundColor,
  changeTextColor,
  decreaseIndent,
  expandAndRemoveMarks,
  increaseIndent,
  insertContent,
  insertTable,
  listCommands,
  replaceWithMarkedText,
  toggleWrapper
} from '../utilities/commands';
import {MenuItemPopupForActionComponent} from './popups/menu-item-popup-for-action.component';
import {MenuItemPopupLinkComponent} from './popups/menu-item-popup-link.component';
import {MenuItemPopupImageComponent} from './popups/menu-item-popup-image.component';
import {Type} from '@angular/core';
import {MenuItemPopupTableComponent} from './popups/menu-item-popup-table.component';
import {
  addColumnAfter,
  addColumnBefore,
  addRowAfter,
  addRowBefore,
  deleteColumn,
  deleteRow,
  deleteTable,
  TableMap
} from 'prosemirror-tables';

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
   * @returns Node if the node is inside the active elements or undefined if not found
   */
  hasNode(node: NodeForLookup): AncestorNode | undefined {
    return this.ancestors.find(n => areNodesEquals(n, node));
  }

  /**
   * Checks if the node type is active
   * @param type Node type to check
   * @returns Node if the node type is inside the active elements or undefined if not found
   */
  hasNodeType(type: NodeTypeForLookup): AncestorNode | undefined {
    return this.ancestors.find(n => areNodeTypesEquals(n.type, type));
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
  P extends MenuItemPopupForActionComponent = MenuItemPopupForActionComponent,
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
  popup?: Type<P>;
}

export type MarkMenuItemActions =
  | 'link'
  | 'remove_link'
  | 'inline_code'
  | 'underline'
  | 'strikethrough'
  | 'italic'
  | 'bold'
  | 'superscript'
  | 'subscript'
	| 'text_color'
	| 'background_color'
  ;
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
  | 'check_list'
  | 'create_table'
  | 'delete_table'
  | 'add_table_row_before'
  | 'add_table_row_after'
  | 'add_table_column_before'
  | 'add_table_column_after'
  | 'delete_table_row'
	| 'delete_table_column'
  ;
export type MenuItemTypes =
  & { readonly [action in NodeMenuItemActions]: MenuItemTypeAction<NodeType> }
  & { readonly [action in MarkMenuItemActions]: MenuItemTypeAction<MarkType> };

/** List of predefined basic menu item types */
export const MENU_ITEM_TYPES: MenuItemTypes = {

  ///
  /// Marks
  ///
  link: {
    type: MARK_TYPES.link,
    attrs({ state, attrs }): { title: string, href: string, from: number, to?: number } & Attrs {
      return {
        title: '',
        alt: '',
        href: '#',
        from: state.selection.from,
        ...attrs,
      };
    },
    command({state, attrs}) {
      const {title, href, from, to} = this.attrs({state, attrs});
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
    attrs({ attrs}): { title: string, alt?: string, src: string } & Attrs {
      return {
        title: '',
        src: '',
        ...attrs,
      }
    },
    command({state, attrs}): Command {
      const {title, alt, src} = this.attrs({state, attrs});
      const image = this.type.create({title, alt, src});
      return insertContent(state.selection.head, image);
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

  create_table: {
    type: NODE_TYPES.table,
    attrs({ attrs }): { rows: number, cols: number } & Attrs {
      return {
        rows: 2,
        cols: 2,
        ...attrs,
      };
    },
    command({ state, attrs }) {
      const {rows, cols} = this.attrs({state, attrs});
      return insertTable(state.selection.head, rows, cols);
    },
    status({state, attrs}) {
      return this.command({state, attrs})(state) ? MenuItemStatus.ENABLED : MenuItemStatus.DISABLED;
    },
    popup: MenuItemPopupTableComponent
  },

  delete_table: {
    type: NODE_TYPES.table,
    attrs({attrs}) { return attrs ?? {}; },
    command() {
      return deleteTable;
    },
    status({state, attrs}) {
      return this.command({state, attrs})(state) ? MenuItemStatus.ENABLED : MenuItemStatus.HIDDEN;
    },
  },

  add_table_row_before: addTableElement(true, true),
  add_table_row_after: addTableElement(true, false),
  add_table_column_before: addTableElement(false, true),
  add_table_column_after: addTableElement(false, false),

  delete_table_row: deleteTableElement(true),
  delete_table_column: deleteTableElement(false),

  text_color: changeColor(true),
  background_color: changeColor(false),
}

// Heading action function
function heading_action(level: number): MenuItemTypeAction<NodeType> {
  const baseAttrs = { level };
  return {
    type: NODE_TYPES.heading,
    attrs({attrs}): { level: number } & Attrs {
      return {
        ...baseAttrs,
        ...attrs,
		  };
    },
    command({state, attrs}): Command {
      return setBlockType(this.type, this.attrs({state, attrs}));
    },
    status({state, elements, attrs}): MenuItemStatus {
      const node: NodeForLookup = {type: this.type, attrs: this.attrs({state, attrs})};
      if (elements.hasNode(node)) { return MenuItemStatus.ACTIVE; }

      return this.command({state, attrs})(state) ? MenuItemStatus.ENABLED : MenuItemStatus.DISABLED;
    },
  }
}

// Table element addition action function
function addTableElement(isRow: boolean, isBefore: boolean): MenuItemTypeAction<NodeType> {
  const commands = isRow
    ? { before: addRowBefore, after: addRowAfter }
    : { before: addColumnBefore, after: addColumnAfter };
  const command = isBefore ? commands.after : commands.before;

  return {
    type: NODE_TYPES.table,
    attrs({attrs}) { return attrs ?? {}; },
    command(): Command {
      return command;
    },
    status({state, elements, attrs}): MenuItemStatus {
      // Check if it is inside a table
      if (!elements.hasNodeType(this.type)) { return MenuItemStatus.HIDDEN; }
      return this.command({state, attrs})(state) ? MenuItemStatus.ENABLED : MenuItemStatus.HIDDEN;
    },
  }
}

// Table element deleting action function
function deleteTableElement(isRow: boolean): MenuItemTypeAction<NodeType> {
	const command = isRow ? deleteRow : deleteColumn;

	return {
		type: NODE_TYPES.table,
		attrs({attrs}) { return attrs ?? {}; },
		command(): Command {
			return command;
		},
		status({elements}): MenuItemStatus {
			// Check if it is inside a table
			const tableNode = elements.hasNodeType(this.type);
			if (!tableNode) { return MenuItemStatus.HIDDEN; }

			const tableMap = TableMap.get(tableNode);

			// Check if at least one row or column will be left when deleting
			const canDelete = isRow ? tableMap.height > 1 : tableMap.width > 1;
			return canDelete ? MenuItemStatus.ENABLED : MenuItemStatus.DISABLED;
		},
	}
}

// Table element deleting action function
function changeColor(isTextColor: boolean): MenuItemTypeAction<MarkType> {
	const target = isTextColor
    ? { type: MARK_TYPES.txt_color, command: changeTextColor, popup: undefined }
    : { type: MARK_TYPES.bg_color, command: changeBackgroundColor, popup: undefined };

	return {
		type: target.type,
		attrs({attrs}): { color?: string } & Attrs {
			return {
				color: undefined,
				...attrs,
			};
		},
		command({state, attrs}): Command {
      const {color} = this.attrs({state, attrs});
      return target.command(color);
		},
		status({state, attrs}): MenuItemStatus {
			return this.command({state, attrs}) ? MenuItemStatus.ENABLED : MenuItemStatus.DISABLED;
		},
    popup: target.popup
	}
}
