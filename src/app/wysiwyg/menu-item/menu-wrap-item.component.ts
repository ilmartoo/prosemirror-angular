import {Component} from '@angular/core';
import {MenuItemComponent, MenuItemStatus} from './menu-item.component';
import {MenuNodeItemComponent} from './menu-node-item.component';
import {wrapIn} from 'prosemirror-commands';
import {EditorView} from 'prosemirror-view';
import {EditorHeadSelectionActiveElements} from '../menu/menu.component';
import {Command} from 'prosemirror-state';

@Component({
  selector: 'app-menu-wrap-item',
  templateUrl: './menu-item.component.html',
  styleUrls: ['./menu-item.component.scss'],
  providers: [{ provide: MenuItemComponent, useExisting: MenuWrapItemComponent }],
})
export class MenuWrapItemComponent extends MenuNodeItemComponent {

  protected override updatedCommand(view: EditorView): Command {
    return wrapIn(this.type, this.attrs);
  }

  protected override calculateStatus(view: EditorView, activeElements: EditorHeadSelectionActiveElements): MenuItemStatus {
    const isEnabled = this.command(view.state, undefined, view);
    return isEnabled ? MenuItemStatus.ENABLED : MenuItemStatus.DISABLED;
  }
}
