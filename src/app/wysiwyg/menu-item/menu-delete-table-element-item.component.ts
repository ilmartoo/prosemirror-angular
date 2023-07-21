import {Component, Input} from '@angular/core';
import {MenuItemComponent} from './menu-item.component';
import {EditorView} from 'prosemirror-view';

import {areNodeTypesEquals} from "../utilities/nodes-helper";
import {Command} from 'prosemirror-state';
import {deleteColumn, deleteRow, TableMap} from 'prosemirror-tables';
import {customSchema} from '../text-editor/custom-schema';
import {MenuSchemaItemComponent} from './menu-schema-item.component';
import {CursorActiveElements, MenuItemStatus} from './menu-item-types';

@Component({
  selector: 'app-menu-delete-table-element-item',
  templateUrl: './menu-item.component.html',
  styleUrls: ['./menu-item.component.scss'],
  providers: [{ provide: MenuItemComponent, useExisting: MenuDeleteTableElementItemComponent }],
})
export class MenuDeleteTableElementItemComponent extends MenuSchemaItemComponent {

  @Input({ required: false }) override type = customSchema.nodes.table;
  @Input({ required: true }) isColumn!: boolean;

  protected override updatedCommand(view: EditorView): Command {
    return this.isColumn ? deleteColumn : deleteRow;
  }

  protected override calculateStatus(view: EditorView, activeElements: CursorActiveElements): MenuItemStatus {
    const tableNode = activeElements.ancestors.find(node => areNodeTypesEquals(node.type, this.type));
    if (!tableNode) { return MenuItemStatus.HIDDEN; }

    const tableMap = TableMap.get(tableNode);
    const canDelete = this.isColumn ? tableMap.width > 1 : tableMap.height > 1;
    return canDelete ? MenuItemStatus.ENABLED : MenuItemStatus.DISABLED;
  }
}
