import {Command, EditorState} from 'prosemirror-state';
import {AlignmentStyle, markTypes, nodeTypes} from '../text-editor/custom-schema';
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
  isAlignableNode,
  isListNode,
  NodeForLookup,
  NodeTypeForLookup
} from '../utilities/nodes-helper';
import {
  changeBackgroundColor,
  changeTextAlignment,
  changeTextColor,
  decreaseIndent,
  editContent,
  expandAndRemoveMarks,
  increaseIndent,
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
import {MenuItemPopupTextColorComponent} from './popups/menu-item-popup-text-color.component';
import {MenuItemPopupBackgroundColorComponent} from './popups/menu-item-popup-background-color.component';
import {MenuItemPopupFormulaComponent} from './popups/menu-item-popup-formula.component';

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
   * @returns The active mark if the mark is inside the active elements or undefined if not found
   */
  hasMark(mark: MarkForLookup): Mark | undefined {
    return this.marks.find(m => areMarksEquals(m, mark));
  }

  /**
   * Checks if the mark type is active
   * @param type Mark type to check
   * @returns The active mark if the mark type is inside the active elements or undefined if not found
   */
  hasMarkType(type: MarkTypeForLookup): Mark | undefined {
    return this.marks.find(m => areMarkTypesEquals(m.type, type));
  }

  /**
   * Checks if the node is active
   * @param node Node to check
   * @returns The active node if the node is inside the active elements or undefined if not found
   */
  hasNode(node: NodeForLookup): AncestorNode | undefined {
    return this.ancestors.find(n => areNodesEquals(n, node));
  }

  /**
   * Checks if the node type is active
   * @param type Node type to check
   * @returns The active node if the node type is inside the active elements or undefined if not found
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
  | 'create_table'
  | 'delete_table'
  | 'add_table_row_before'
  | 'add_table_row_after'
  | 'add_table_column_before'
  | 'add_table_column_after'
  | 'delete_table_row'
	| 'delete_table_column'
	| 'left_alignment'
	| 'centered_alignment'
	| 'right_alignment'
	| 'justified_alignment'
  | 'katex_formula'
  ;
export type MenuItemTypes =
  & { readonly [action in NodeMenuItemActions]: MenuItemTypeAction<NodeType> }
  & { readonly [action in MarkMenuItemActions]: MenuItemTypeAction<MarkType> };

/** List of predefined basic menu item types */
export const menuItemTypes: MenuItemTypes = {

  /// MARKS ///

  // Link related //
  link: {
    type: markTypes.link,
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
    type: markTypes.link,
    attrs({attrs}) { return attrs ?? {}; },
    command({state}) {
      return expandAndRemoveMarks(state!.selection.head, [this.type]);
    },
    status({state, attrs}) {
      return this.command({state, attrs})(state) ? MenuItemStatus.ENABLED : MenuItemStatus.HIDDEN;
    },
  },

  // Code related //
  inline_code: {
    type: markTypes.code,
    attrs({attrs}) { return attrs ?? {}; },
    command(): Command {
      return toggleMark(this.type);
    },
    status({state, elements, attrs}) {
      return elements.hasMarkType(this.type) ? MenuItemStatus.ACTIVE
        : (this.command({state, attrs})(state) ? MenuItemStatus.ENABLED : MenuItemStatus.DISABLED);
    },
  },

  // Line decoration related //
  underline: {
    type: markTypes.underline,
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
    type: markTypes.strikethrough,
    attrs({attrs}) { return attrs ?? {}; },
    command(): Command {
      return toggleMark(this.type);
    },
    status({state, elements, attrs}) {
      return elements.hasMarkType(this.type) ? MenuItemStatus.ACTIVE
        : (this.command({state, attrs})(state) ? MenuItemStatus.ENABLED : MenuItemStatus.DISABLED);
    },
  },

  // Text styling related //
  italic: {
    type: markTypes.em,
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
    type: markTypes.strong,
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
    type: markTypes.superscript,
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
    type: markTypes.subscript,
    attrs({attrs}) { return attrs ?? {}; },
    command(): Command {
      return toggleMark(this.type);
    },
    status({state, elements, attrs}) {
      return elements.hasMarkType(this.type) ? MenuItemStatus.ACTIVE
        : (this.command({state, attrs})(state) ? MenuItemStatus.ENABLED : MenuItemStatus.DISABLED);
    },
  },

  // Color related //
  text_color: changeColor(true),
  background_color: changeColor(false),

  /// NODES ///

  // Special content related //
  image: {
    type: nodeTypes.image,
    attrs({ state, attrs}): { title: string, alt?: string, src: string } & Attrs {
      return {
        title: '',
        src: '',
        from: state.selection.from,
        ...attrs,
      }
    },
    command({state, attrs}): Command {
      const {title, alt, src, from, to} = this.attrs({state, attrs});
      const image = this.type.create({title, alt, src});
      return editContent(image, from, to);
    },
    status({state, attrs, elements}): MenuItemStatus {
      if (elements.hasNodeType(nodeTypes.image)) { return MenuItemStatus.ACTIVE; }
      return this.command({state, attrs})(state) ? MenuItemStatus.ENABLED : MenuItemStatus.DISABLED;
    },
    popup: MenuItemPopupImageComponent,
  },
  blockquote: {
    type: nodeTypes.blockquote,
    attrs({attrs}) { return attrs ?? {}; },
    command(): Command {
      return toggleWrapper(this.type)
    },
    status({state, elements, attrs}): MenuItemStatus {
      return elements.hasNodeType(this.type) ? MenuItemStatus.ACTIVE
        : (this.command({state, attrs})(state) ? MenuItemStatus.ENABLED : MenuItemStatus.DISABLED);
    },
  },

  // Text related //
  paragraph: {
    type: nodeTypes.paragraph,
    attrs({attrs}) { return attrs ?? {}; },
    command(): Command {
      return setBlockType(this.type);
    },
    status({state, elements, attrs}): MenuItemStatus {
      return elements.hasNodeType(this.type) ? MenuItemStatus.ACTIVE
        : (this.command({state, attrs})(state) ? MenuItemStatus.ENABLED : MenuItemStatus.DISABLED);
    },
  },

  // Indent related //
  indent: {
    type: nodeTypes.indent,
    attrs({attrs}) { return attrs ?? {}; },
    command(): Command {
      return increaseIndent;
    },
    status({state, attrs}): MenuItemStatus {
      return this.command({state, attrs})(state) ? MenuItemStatus.ENABLED : MenuItemStatus.DISABLED;
    },
  },
  deindent: {
    type: nodeTypes.indent,
    attrs({attrs}) { return attrs ?? {}; },
    command(): Command {
      return decreaseIndent;
    },
    status({state, attrs}): MenuItemStatus {
      return this.command({state, attrs})(state) ? MenuItemStatus.ENABLED : MenuItemStatus.DISABLED;
    },
  },

  // Heading related //
  heading_1: heading_action(1),
  heading_2: heading_action(2),
  heading_3: heading_action(3),

  // Code related //
  code_block: {
    type: nodeTypes.code_block,
    attrs({attrs}) { return attrs ?? {}; },
    command(): Command {
      return setBlockType(this.type);
    },
    status({state, elements, attrs}): MenuItemStatus {
      return elements.hasNodeType(this.type) ? MenuItemStatus.ACTIVE
        : (this.command({state, attrs})(state) ? MenuItemStatus.ENABLED : MenuItemStatus.DISABLED);
    },
  },

  // List related //
  ordered_list: {
    type: nodeTypes.ordered_list,
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
    type: nodeTypes.bullet_list,
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

  // Table related //
  create_table: {
    type: nodeTypes.table,
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
    type: nodeTypes.table,
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

  // Alignment related //
  left_alignment: alignText(AlignmentStyle.LEFT),
  centered_alignment: alignText(AlignmentStyle.CENTER),
  right_alignment: alignText(AlignmentStyle.RIGHT),
  justified_alignment: alignText(AlignmentStyle.JUSTIFY),

  // KaTeX //
  katex_formula: {
		type: nodeTypes.katex_formula,
		attrs({state, attrs}): { formula: string, from: number, to?: number } & Attrs {
      return {
        formula: '',
        from: state.selection.from,
        ...attrs,
      };
    },
		command({state, attrs}) {
			const {formula, from, to} = this.attrs({state, attrs});
			const katex_formula = this.type.create({formula});
      return editContent(katex_formula, from, to)
		},
		status({state, attrs, elements}) {
      if (elements.hasNodeType(nodeTypes.katex_formula)) { return MenuItemStatus.ACTIVE; }
			return this.command({state, attrs})(state) ? MenuItemStatus.ENABLED : MenuItemStatus.DISABLED;
		},
    popup: MenuItemPopupFormulaComponent,
  }
}

// Heading action function
function heading_action(level: number): MenuItemTypeAction<NodeType> {
  const baseAttrs = { level };
  return {
    type: nodeTypes.heading,
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
  const command = isBefore ? commands.before : commands.after;

  return {
    type: nodeTypes.table,
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
		type: nodeTypes.table,
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

// Text & background color change action function
function changeColor(isTextColor: boolean): MenuItemTypeAction<MarkType> {
	const target = isTextColor
    ? { type: markTypes.txt_color, command: changeTextColor, popup: MenuItemPopupTextColorComponent }
    : { type: markTypes.bg_color, command: changeBackgroundColor, popup: MenuItemPopupBackgroundColorComponent };

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
			return this.command({state, attrs})(state) ? MenuItemStatus.ENABLED : MenuItemStatus.DISABLED;
		},
    popup: target.popup
	}
}

// Text alignment action function
function alignText(alignment: AlignmentStyle): MenuItemTypeAction<NodeType> {
  return {
    type: nodeTypes.paragraph,
    attrs({attrs}): { alignment?: AlignmentStyle } & Attrs {
      return {
        alignment: alignment,
        ...attrs,
      };
    },
    command({state, attrs}): Command {
      const {alignment} = this.attrs({state, attrs});
      return changeTextAlignment(alignment);
    },
    status({state, attrs, elements}): MenuItemStatus {
      const {alignment} = this.attrs({state, attrs});
      const alignableNode = elements.ancestors.find(node => isAlignableNode(node));
      if (alignableNode?.attrs['alignment'] === alignment) {
        return MenuItemStatus.ACTIVE;
      }

      return this.command({state, attrs})(state) ? MenuItemStatus.ENABLED : MenuItemStatus.DISABLED;
    },
  }
}
