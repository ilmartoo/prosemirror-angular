import {Component, Input} from '@angular/core';
import {MenuItemComponent} from './menu-item.component';
import {EditorView} from 'prosemirror-view';

import {areNodeTypesEquals} from "../utilities/nodes-helper";
import {Command} from 'prosemirror-state';
import {addColumnAfter, addColumnBefore, addRowAfter, addRowBefore} from 'prosemirror-tables';
import {customSchema} from '../text-editor/custom-schema';
import {MenuSchemaItemComponent} from './menu-schema-item.component';
import {CursorActiveElements, MenuItemStatus} from './menu-item-types';

@Component({
  selector: 'app-menu-create-table-element-item',
  templateUrl: './menu-item.component.html',
  styleUrls: ['./menu-item.component.scss'],
  providers: [{ provide: MenuItemComponent, useExisting: MenuCreateTableElementItemComponent }],
})
export class MenuCreateTableElementItemComponent extends MenuSchemaItemComponent {

  @Input({ required: false }) override type = customSchema.nodes.table;
  @Input({ required: true }) isColumn!: boolean;
  @Input({ required: true }) isAfter!: boolean;

  protected override updatedCommand(view: EditorView): Command {
    const commands = this.isColumn
      ? { before: addColumnBefore, after: addColumnAfter }
      : { before: addRowBefore, after: addRowAfter };
    return this.isAfter ? commands.after : commands.before;
  }

  protected override calculateStatus(view: EditorView, activeElements: CursorActiveElements): MenuItemStatus {
    const isInsideTable = !!activeElements.ancestors.find(node => areNodeTypesEquals(node.type, this.type));
    const isEnabled = this.command(view.state);
    return isInsideTable && isEnabled ? MenuItemStatus.ENABLED : MenuItemStatus.HIDDEN;
  }
}
