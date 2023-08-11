import {Component, ContentChildren, QueryList} from '@angular/core';
import {EditorView} from 'prosemirror-view';
import {EditorState, Plugin, PluginKey, PluginView} from 'prosemirror-state';
import {fixTables} from 'prosemirror-tables';

import {CursorActiveElements} from '../menu-item/menu-item-types';
import {UpdatableItem} from '../menu-item/updatable-item';
import {executeAfter} from '../utilities/multipurpose-helper';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss'],
})
export class MenuComponent implements PluginView {

  static readonly PLUGIN_KEY = new PluginKey('menu');
  readonly plugin: Plugin<CursorActiveElements>;

  @ContentChildren(UpdatableItem) items!: QueryList<UpdatableItem>;

  protected init = false;

  constructor() {
    const editorMenu = this;
    this.plugin = new Plugin({
      view(view: EditorView): PluginView {
        editorMenu.init = true;

        // Delays the execution of the update to a time when the view has been updated & the menu items are displayed
        executeAfter(() => editorMenu.update(view));

        return editorMenu;
      },
      state: {
        init(config, instance) {
          return CursorActiveElements.from(instance);
        },
        apply(tr, value, oldState, newState) {
          return CursorActiveElements.from(newState);
        },
      },
      key: MenuComponent.PLUGIN_KEY,
    });
  }

  /******************* ProseMirror Plugin creation & PluginView methods *******************/

  public update(view: EditorView, prevState?: EditorState): void {

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
    const elements = this.plugin.getState(view.state)!;
    this.items.forEach(item => item.update(view, elements));
  }
}

/**
 * Retrieves the menu plugin from the plugin array of the editor state
 * @param state Editor state
 * @returns Menu plugin if exists
 */
export function retrieveMenuPlugin(state: EditorState): Plugin<CursorActiveElements> | undefined {
  const plugin = state.plugins.find(p => p.spec.key === MenuComponent.PLUGIN_KEY);
  return plugin as Plugin<CursorActiveElements> | undefined;
}
