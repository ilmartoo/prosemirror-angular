import {Component, Input} from '@angular/core';
import {MenuItemComponent, MenuItemStatus} from './menu-item.component';
import {EditorView} from 'prosemirror-view';
import {EditorHeadSelectionActiveElements} from '../menu/menu.component';

import {areNodeTypesEquals} from "../utilities/nodes-helper";
import {Command} from 'prosemirror-state';
import {toggleHeaderCell, toggleHeaderColumn, toggleHeaderRow} from 'prosemirror-tables';
import {MenuSchemaItemComponent} from './menu-schema-item.component';
import {customSchema} from '../text-editor/custom-schema';

export enum ToggleHeaders {
  CELL = 'CELL',
  ROW = 'ROW',
  COLUMN = 'COLUMN',
}

export type ToggleHeaderType = keyof typeof ToggleHeaders;

@Component({
  selector: 'app-menu-toggle-table-header-item',
  templateUrl: './menu-item.component.html',
  styleUrls: ['./menu-item.component.scss'],
  providers: [{ provide: MenuItemComponent, useExisting: MenuToggleTableHeaderComponent }],
})
export class MenuToggleTableHeaderComponent extends MenuSchemaItemComponent {

  @Input({ required: false }) override type = customSchema.nodes.table;
  @Input({ required: true }) headerType!: ToggleHeaderType;

  protected override updatedCommand(view: EditorView): Command {
    switch (ToggleHeaders[this.headerType]) {
      case ToggleHeaders.CELL: return toggleHeaderCell;
      case ToggleHeaders.ROW: return toggleHeaderRow;
      case ToggleHeaders.COLUMN: return toggleHeaderColumn;
    }
    return () => false;
  }

  protected override calculateStatus(view: EditorView, activeElements: EditorHeadSelectionActiveElements): MenuItemStatus {
    const isInsideTable = !!activeElements.nodes.find(node => areNodeTypesEquals(node.type, this.type));
    const isEnabled = this.command(view.state);
    return isInsideTable && isEnabled ? MenuItemStatus.ENABLED : MenuItemStatus.HIDDEN;
  }
}
