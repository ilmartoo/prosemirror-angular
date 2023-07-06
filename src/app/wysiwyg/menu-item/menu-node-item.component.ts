import {Component} from '@angular/core';
import {MenuItemComponent, MenuItemStatus} from './menu-item.component';
import {setBlockType} from 'prosemirror-commands';
import {NodeType} from 'prosemirror-model';
import {MenuSchemaItemComponent} from './menu-schema-item.component';
import {EditorView} from 'prosemirror-view';
import {EditorSelectionActiveElements} from '../menu/menu.component';

import {areNodesEquals} from "../utilities/nodes-helper";
import {Command} from 'prosemirror-state';

@Component({
  selector: 'app-menu-node-item',
  templateUrl: './menu-item.component.html',
  styleUrls: ['./menu-item.component.scss'],
  providers: [{ provide: MenuItemComponent, useExisting: MenuNodeItemComponent }],
})
export class MenuNodeItemComponent extends MenuSchemaItemComponent<NodeType> {

  protected override updateCommand(view: EditorView): Command {
    return setBlockType(this.type, this.attrs);
  }

  protected override calculateStatus(view: EditorView, activeElements: EditorSelectionActiveElements): MenuItemStatus {
    const isActive = !!activeElements.nodes.find(node => areNodesEquals(node, this));
    const isEnabled = this.command(view.state, undefined, view);

    return isActive ? MenuItemStatus.ACTIVE : (isEnabled ? MenuItemStatus.ENABLED : MenuItemStatus.DISABLED);
  }
}
