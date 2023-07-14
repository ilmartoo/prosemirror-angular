import {Component, Input} from '@angular/core';
import {MenuItemComponent, MenuItemStatus} from './menu-item.component';
import {EditorView} from 'prosemirror-view';
import {EditorHeadSelectionActiveElements} from '../menu/menu.component';

import {areNodeTypesEquals} from "../utilities/nodes-helper";
import {Command} from 'prosemirror-state';
import {deleteColumn, deleteRow, TableMap} from 'prosemirror-tables';
import {customSchema} from '../text-editor/custom-schema';
import {MenuNodeItemComponent} from './menu-node-item.component';

@Component({
  selector: 'app-menu-delete-table-element-item',
  templateUrl: './menu-item.component.html',
  styleUrls: ['./menu-item.component.scss'],
  providers: [{ provide: MenuItemComponent, useExisting: MenuDeleteTableElementItemComponent }],
})
export class MenuDeleteTableElementItemComponent extends MenuNodeItemComponent {

  @Input({ required: false }) override type = customSchema.nodes.table;
  @Input({ required: true }) isColumn!: boolean;

  protected override updatedCommand(view: EditorView): Command {
    return this.isColumn ? deleteColumn : deleteRow;
  }

  protected override calculateStatus(view: EditorView, activeElements: EditorHeadSelectionActiveElements): MenuItemStatus {
    const tableNode = activeElements.nodes.find(node => areNodeTypesEquals(node.type, this.type));
    if (!tableNode) { return MenuItemStatus.HIDDEN; }

    const tableMap = TableMap.get(tableNode);
    const canDelete = this.isColumn ? tableMap.width > 1 : tableMap.height > 1;
    return canDelete ? MenuItemStatus.ENABLED : MenuItemStatus.DISABLED;
  }
}
