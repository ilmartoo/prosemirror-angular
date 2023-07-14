import {Component, Input} from '@angular/core';
import {MenuItemComponent, MenuItemStatus} from './menu-item.component';
import {EditorView} from 'prosemirror-view';
import {EditorHeadSelectionActiveElements} from '../menu/menu.component';
import {decreaseIndent, increaseIndent} from '../utilities/commands';
import {Command} from 'prosemirror-state';

@Component({
  selector: 'app-menu-indent-item',
  templateUrl: './menu-item.component.html',
  styleUrls: ['./menu-item.component.scss'],
  providers: [{ provide: MenuItemComponent, useExisting: MenuIndentItemComponent }],
})
export class MenuIndentItemComponent extends MenuItemComponent {

  @Input({ required: true }) isIncrease!: boolean;

  protected override updatedCommand(view: EditorView): Command {
    return this.isIncrease ? increaseIndent : decreaseIndent;
  }

  protected override calculateStatus(view: EditorView, activeElements: EditorHeadSelectionActiveElements): MenuItemStatus {
    const isEnabled = this.command(view.state, undefined, view);
    return isEnabled ? MenuItemStatus.ENABLED : MenuItemStatus.DISABLED;
  }
}
