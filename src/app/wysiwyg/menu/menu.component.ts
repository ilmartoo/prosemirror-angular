import {Component, QueryList, ViewChildren} from '@angular/core';
import {MenuItemComponent} from '../menu-item/menu-item.component';
import {EditorView} from 'prosemirror-view';
import {EditorState, Plugin, PluginView} from 'prosemirror-state';
import {Mark} from 'prosemirror-model';
import {customSchema} from '../text-editor/custom-schema';
import {activeMarksInSelectionStart} from "../utilities/marks-helper";
import {ancestorNodesInSelectionStart, ExtendedNode} from "../utilities/nodes-helper";
import {fixTables} from 'prosemirror-tables';
import {executeAfter} from '../utilities/multipurpose-helper';


// TODO: Let it be an dictionary as { [markTypeName: string]: Mark[], [nodeTypeName: string]: ProseNode[] }
export type EditorHeadSelectionActiveElements = {
  marks: Mark[],
  nodes: ExtendedNode[],
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
    const updateData: EditorHeadSelectionActiveElements = {
      marks: activeMarksInSelectionStart(state),
      nodes: ancestorNodesInSelectionStart(state),
    };

    this.items.forEach(item => item.update(view, updateData));
  }
}
