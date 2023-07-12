import {Component} from '@angular/core';
import {MenuItemComponent, MenuItemStatus} from './menu-item.component';
import {customSchema} from '../text-editor/custom-schema';
import {Command} from 'prosemirror-state';
import {expandAndRemoveMarks} from '../utilities/commands';
import {EditorView} from 'prosemirror-view';
import {EditorSelectionActiveElements} from '../menu/menu.component';
import {MenuSchemaItemComponent} from './menu-schema-item.component';
import {areEquals} from '../utilities/multipurpose-helper';
import {MarkType} from 'prosemirror-model';
import {deleteTable} from 'prosemirror-tables';

@Component({
  selector: 'app-menu-remove-element-item',
  templateUrl: './menu-item.component.html',
  styleUrls: ['./menu-item.component.scss'],
  providers: [{ provide: MenuItemComponent, useExisting: MenuRemoveElementItemComponent }],
})
export class MenuRemoveElementItemComponent extends MenuSchemaItemComponent {

  private getCommandByType(view: EditorView): Command {
    // Link
    if (areEquals(this.type.name, customSchema.marks.link.name)) {
      const linkType = this.type as MarkType;
      return expandAndRemoveMarks(view.state.selection.head, [linkType]);
    }
    // Table
    if (areEquals(this.type.name, customSchema.nodes.table.name)) {
      return deleteTable;
    }
    // Other
    return () => false;
  }

  protected override updatedCommand(view: EditorView): Command {
    return this.getCommandByType(view);
  }

  protected override calculateStatus(view: EditorView, activeElements: EditorSelectionActiveElements): MenuItemStatus {
    const isEnabled = this.command(view.state);
    return isEnabled ? MenuItemStatus.ENABLED : MenuItemStatus.HIDDEN;
  }
}
