import {Component} from '@angular/core';
import {MenuItemComponent} from './menu-item.component';
import {toggleMark} from 'prosemirror-commands';
import {MarkType} from 'prosemirror-model';
import {MenuSchemaItemComponent} from './menu-schema-item.component';
import {EditorView} from 'prosemirror-view';

import {areMarkTypesEquals} from "../utilities/marks-helper";
import {Command} from 'prosemirror-state';
import {CursorActiveElements, MenuItemStatus} from './menu-item-types';

@Component({
  selector: 'app-menu-mark-item',
  templateUrl: './menu-item.component.html',
  styleUrls: ['./menu-item.component.scss'],
  providers: [{ provide: MenuItemComponent, useExisting: MenuMarkItemComponent }],
})
export class MenuMarkItemComponent extends MenuSchemaItemComponent<MarkType> {

  protected override updatedCommand(view: EditorView): Command {
    return toggleMark(this.type, this.attrs);
  }

  protected override calculateStatus(view: EditorView, activeElements: CursorActiveElements): MenuItemStatus {
      const isActive = !!activeElements.marks.find(mark => areMarkTypesEquals(mark.type, this.type));
      const isEnabled = this.command(view.state, undefined, view);

      return isActive ? MenuItemStatus.ACTIVE : (isEnabled ? MenuItemStatus.ENABLED : MenuItemStatus.DISABLED);
  }
}
