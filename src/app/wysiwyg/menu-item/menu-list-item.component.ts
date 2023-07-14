import {Component} from '@angular/core';
import {MenuItemComponent, MenuItemStatus} from './menu-item.component';
import {wrapInList} from 'prosemirror-schema-list';
import {MenuNodeItemComponent} from './menu-node-item.component';
import {chainCommands} from 'prosemirror-commands';
import {changeListType} from '../utilities/commands';
import {EditorView} from 'prosemirror-view';
import {EditorHeadSelectionActiveElements} from '../menu/menu.component';

import {areNodeTypesEquals} from "../utilities/nodes-helper";
import {Command} from 'prosemirror-state';

@Component({
  selector: 'app-menu-list-item',
  templateUrl: './menu-item.component.html',
  styleUrls: ['./menu-item.component.scss'],
  providers: [{ provide: MenuItemComponent, useExisting: MenuListItemComponent }],
})
export class MenuListItemComponent extends MenuNodeItemComponent {

  protected override updatedCommand(view: EditorView): Command {
    return chainCommands(wrapInList(this.type, this.attrs), changeListType(this.type, this.attrs));
  }

  protected override calculateStatus(view: EditorView, activeElements: EditorHeadSelectionActiveElements): MenuItemStatus {
    const isActive = !!activeElements.nodes.find(node => areNodeTypesEquals(node.type, this.type));
    const isEnabled = this.command(view.state, undefined, view);

    return isActive ? MenuItemStatus.ACTIVE : (isEnabled ? MenuItemStatus.ENABLED : MenuItemStatus.DISABLED);
  }
}
