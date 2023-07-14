import {Component, Input} from '@angular/core';
import {MenuItemComponent, MenuItemStatus} from './menu-item.component';
import {EditorView} from 'prosemirror-view';
import {EditorHeadSelectionActiveElements} from '../menu/menu.component';

import {areNodeTypesEquals} from "../utilities/nodes-helper";
import {Command} from 'prosemirror-state';
import {addColumnAfter, addColumnBefore, addRowAfter, addRowBefore} from 'prosemirror-tables';
import {customSchema} from '../text-editor/custom-schema';
import {MenuNodeItemComponent} from './menu-node-item.component';

@Component({
  selector: 'app-menu-create-table-element-item',
  templateUrl: './menu-item.component.html',
  styleUrls: ['./menu-item.component.scss'],
  providers: [{ provide: MenuItemComponent, useExisting: MenuCreateTableElementItemComponent }],
})
export class MenuCreateTableElementItemComponent extends MenuNodeItemComponent {

  @Input({ required: false }) override type = customSchema.nodes.table;
  @Input({ required: true }) isColumn!: boolean;
  @Input({ required: true }) isAfter!: boolean;

  protected override updatedCommand(view: EditorView): Command {
    const commands = this.isColumn
      ? { before: addColumnBefore, after: addColumnAfter }
      : { before: addRowBefore, after: addRowAfter };
    return this.isAfter ? commands.after : commands.before;
  }

  protected override calculateStatus(view: EditorView, activeElements: EditorHeadSelectionActiveElements): MenuItemStatus {
    const isInsideTable = !!activeElements.nodes.find(node => areNodeTypesEquals(node.type, this.type));
    const isEnabled = this.command(view.state);
    return isInsideTable && isEnabled ? MenuItemStatus.ENABLED : MenuItemStatus.HIDDEN;
  }
}
