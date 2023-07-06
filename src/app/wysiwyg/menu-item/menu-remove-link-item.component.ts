import {Component, Input} from '@angular/core';
import {MenuItemComponent, MenuItemStatus} from './menu-item.component';
import {MenuMarkItemComponent} from './menu-mark-item.component';
import {customSchema} from '../text-editor/custom-schema';
import {Command} from 'prosemirror-state';
import {expandAndRemoveMarks} from '../utilities/commands';
import {EditorView} from 'prosemirror-view';
import {EditorSelectionActiveElements} from '../menu/menu.component';

@Component({
  selector: 'app-menu-remove-link-item',
  templateUrl: './menu-item.component.html',
  styleUrls: ['./menu-item.component.scss'],
  providers: [{ provide: MenuItemComponent, useExisting: MenuRemoveLinkItemComponent }],
})
export class MenuRemoveLinkItemComponent extends MenuMarkItemComponent {

  @Input({ required: false }) override type = customSchema.marks.link;

  protected override updateCommand(view: EditorView): Command {
    return expandAndRemoveMarks(view.state.selection.head, [this.type]);
  }

  protected override calculateStatus(view: EditorView, activeElements: EditorSelectionActiveElements): MenuItemStatus {
    const isEnabled = this.command(view.state, undefined, view);
    return isEnabled ? MenuItemStatus.ENABLED : MenuItemStatus.DISABLED;
  }
}
