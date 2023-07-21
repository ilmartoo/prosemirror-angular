import {Component, QueryList, ViewChildren} from '@angular/core';
import {MenuItemComponent} from '../menu-item/menu-item.component';
import {EditorView} from 'prosemirror-view';
import {EditorState, Plugin, PluginView} from 'prosemirror-state';
import {MARK_TYPES, NODE_TYPES} from '../text-editor/custom-schema';
import {fixTables} from 'prosemirror-tables';
import {executeAfter} from '../utilities/multipurpose-helper';

import {CursorActiveElements, MENU_ITEM_TYPES} from '../menu-item/menu-item-types';


@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss']
})
export class MenuComponent implements PluginView {

  @ViewChildren(MenuItemComponent) items!: QueryList<MenuItemComponent>;

  protected view?: EditorView;
  protected readonly MENU_ITEM_TYPES = MENU_ITEM_TYPES;
  protected readonly NODE_TYPES = NODE_TYPES;
  protected readonly MARK_TYPES = MARK_TYPES;

  /******************* ProseMirror Plugin creation & PluginView methods *******************/

  /**
   * Create a plugin for ProseMirror containing the current component
   * @return Plugin with current component as a PluginView
   */
  public asPlugin(): Plugin {
    const editorMenu: MenuComponent = this;

    return new Plugin({
      view(view: EditorView): PluginView {
        editorMenu.view = view;

        // Delays the execution of the update to a time when the view has been updated & the menu items are displayed
        executeAfter(() => editorMenu.update(view));

        return editorMenu;
      },
    })
  }

  public update(view: EditorView, prevState?: EditorState): void {
    this.view = view;

    // Fix for the tables if needed
    const trTableFix = fixTables(view.state, prevState);
    if (trTableFix) { view.dispatch(trTableFix); }

    this.updateItemStatuses(view);
  }

  public destroy(): void { }

  /******************* Editor Items management *******************/

  /**
   * Updates the editor items given the current view
   * @param view View of the editor
   */
  public updateItemStatuses(view: EditorView): void {
    const state = view.state;
    const elements = CursorActiveElements.from(state);

    this.items.forEach(item => item.update(view, elements));
  }
}
