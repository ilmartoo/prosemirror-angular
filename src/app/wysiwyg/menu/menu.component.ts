import {Component, QueryList, ViewChildren} from '@angular/core';
import {MenuItemComponent} from '../menu-item/menu-item.component';
import {EditorView} from 'prosemirror-view';
import {Plugin, PluginView} from 'prosemirror-state';
import {Mark, Node as ProseNode} from 'prosemirror-model';
import {activeMarksInSelection, ancestorNodesInSelection} from '../utilities/prosemirror-helper';
import {customSchema} from '../text-editor/custom-schema';


export type EditorSelectionActiveElements = {
  marks: Mark[],
  nodes: ProseNode[],
};


@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss']
})
export class MenuComponent implements PluginView {

  @ViewChildren(MenuItemComponent) items!: QueryList<MenuItemComponent>;

  protected view?: EditorView;
  protected readonly customSchema = customSchema;

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
        return editorMenu;
      },
    })
  }

  public update(view: EditorView): void {
    this.view = view;
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
    const updateData: EditorSelectionActiveElements = {
      marks: activeMarksInSelection(state),
      nodes: ancestorNodesInSelection(state),
    };

    this.items.forEach(item => item.update(view, updateData));
  }
}
