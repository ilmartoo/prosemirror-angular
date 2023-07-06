import {Component} from '@angular/core';
import {MenuItemComponent, MenuItemStatus} from './menu-item.component';
import {toggleMark} from 'prosemirror-commands';
import {MarkType} from 'prosemirror-model';
import {MenuSchemaItemComponent} from './menu-schema-item.component';
import {EditorView} from 'prosemirror-view';
import {EditorSelectionActiveElements} from '../menu/menu.component';

import {areMarkTypesEquals} from "../utilities/marks-helper";
import {Command} from 'prosemirror-state';

@Component({
  selector: 'app-menu-mark-item',
  templateUrl: './menu-item.component.html',
  styleUrls: ['./menu-item.component.scss'],
  providers: [{ provide: MenuItemComponent, useExisting: MenuMarkItemComponent }],
})
export class MenuMarkItemComponent extends MenuSchemaItemComponent<MarkType> {

  protected override updateCommand(view: EditorView): Command {
    return toggleMark(this.type, this.attrs);
  }

  protected override calculateStatus(view: EditorView, activeElements: EditorSelectionActiveElements): MenuItemStatus {
      const isActive = !!activeElements.marks.find(mark => areMarkTypesEquals(mark.type, this.type));
      const isEnabled = this.command(view.state, undefined, view);

      return isActive ? MenuItemStatus.ACTIVE : (isEnabled ? MenuItemStatus.ENABLED : MenuItemStatus.DISABLED);
  }
}
