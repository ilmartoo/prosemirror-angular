import {Component, QueryList, ViewChildren} from '@angular/core';
import {MenuItemComponent, MenuItemStatus} from '../menu-item/menu-item.component';
import {EditorView} from 'prosemirror-view';
import {Command, EditorState, Plugin, PluginView} from 'prosemirror-state';
import {Mark, MarkType, Node, NodeType} from 'prosemirror-model';
import {ProseMirrorHelper} from '../utilities/prosemirror-helper';
import {customSchema} from '../text-editor/custom-schema';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss']
})
export class MenuComponent implements PluginView {

  @ViewChildren(MenuItemComponent) items!: QueryList<MenuItemComponent>;

  protected view?: EditorView;
  protected readonly customSchema = customSchema;

  constructor() { }

  protected executeCommand(command: Command, view: EditorView): void {
    command(view.state, view.dispatch, this.view);
  }

  protected focusView(): void {
    this.view?.focus();
  }

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

  public update(view: EditorView, _: EditorState): void {
    this.view = view;
    this.updateItemStatuses(view.state);
  }

  public destroy(): void { }

  /******************* Editor Items management *******************/

  /**
   * Updates the editor items statuses given the current view state
   * @param state State of the editor
   */
  public updateItemStatuses(state: EditorState): void {
    const marks = {
      values: state.schema.marks,
      active: ProseMirrorHelper.activeMarksInSelection(state),
    };
    const nodes = {
      values: state.schema.nodes,
      active: ProseMirrorHelper.parentNodesInSelection(state),
    };

    for (const item of this.items) {
      const type = item.type.name;
      if (!!marks.values[type]) {
        const markItem = item as MenuItemComponent<MarkType>;
        markItem.status = this.calculateMarkStatus(markItem, marks.active, state);
      }
      else if (nodes.values[type]) {
        const nodeItem = item as MenuItemComponent<NodeType>;
        nodeItem.status = this.calculateNodeStatus(nodeItem, nodes.active, state);
      }
    }
  }

  /**
   * Calculates mark item status given current active & available marks
   * @param item Mark item
   * @param activeMarks Active marks
   * @param state State of the editor
   * @private
   */
  private calculateMarkStatus(item: MenuItemComponent<MarkType>, activeMarks: Mark[], state: EditorState): MenuItemStatus {
    const isActive = !!activeMarks.find(mark => ProseMirrorHelper.areMarkTypesEquals(mark.type, item.type));
    const isEnabled = item.command(state, undefined, this.view);

    return isActive ? MenuItemStatus.ACTIVE : (isEnabled ? MenuItemStatus.ENABLED : MenuItemStatus.DISABLED);
  }

  /**
   * Calculates node item status given current active & available nodes
   * @param item Node item
   * @param activeNodes Active nodes
   * @param state State of the editor
   * @private
   */
  private calculateNodeStatus(item: MenuItemComponent<NodeType>, activeNodes: Node[], state: EditorState): MenuItemStatus {
    const isActive = !!activeNodes.find(node => ProseMirrorHelper.areNodesEquals(node, item));
    const isEnabled = item.command(state, undefined, this.view);

    return isActive ? MenuItemStatus.ACTIVE : (isEnabled ? MenuItemStatus.ENABLED : MenuItemStatus.DISABLED);
  }
}
