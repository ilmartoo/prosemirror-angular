import {Component, ContentChildren, QueryList} from '@angular/core';
import {EditorView} from 'prosemirror-view';
import {EditorState, Plugin, PluginView} from 'prosemirror-state';
import {fixTables} from 'prosemirror-tables';
import {executeAfter} from '../utilities/multipurpose-helper';

import {CursorActiveElements} from '../menu-item/menu-item-types';
import {MenuItem} from '../menu-item/menu-item';


@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss'],
})
export class MenuComponent implements PluginView {

  @ContentChildren(MenuItem) items!: QueryList<MenuItem>;

  protected view?: EditorView;

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
