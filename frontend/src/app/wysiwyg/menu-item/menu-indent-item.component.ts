import {Component, Input} from '@angular/core';
import {MenuItemComponent, MenuItemStatus} from './menu-item.component';
import {EditorView} from 'prosemirror-view';
import {EditorSelectionActiveElements} from '../menu/menu.component';
import {decreaseIndent, increaseIndent} from '../utilities/custom-commands';

@Component({
  selector: 'app-menu-indent-item',
  templateUrl: './menu-item.component.html',
  styleUrls: ['./menu-item.component.scss'],
  providers: [{ provide: MenuItemComponent, useExisting: MenuIndentItemComponent }],
})
export class MenuIndentItemComponent extends MenuItemComponent {

  @Input({ required: true }) isIncrease!: boolean;

  protected override initCommand(): void {
    this.command = this.isIncrease ? increaseIndent : decreaseIndent;
  }

  protected override calculateStatus(view: EditorView, activeElements: EditorSelectionActiveElements): MenuItemStatus {
    const isEnabled = this.command(view.state, undefined, view);
    return isEnabled ? MenuItemStatus.ENABLED : MenuItemStatus.DISABLED;
  }
}
