import {Component, QueryList, ViewChildren} from '@angular/core';
import {EditorMenuItemComponent, EditorMenuItemStatus} from '../editor-menu-item/editor-menu-item.component';
import {EditorView} from 'prosemirror-view';
import {Command, EditorState, Plugin, PluginView} from 'prosemirror-state';
import {Mark, MarkType, Node, NodeType} from 'prosemirror-model';
import {ProseMirrorHelper} from '../rich-text-editor/prose-mirror-helper';

@Component({
  selector: 'app-editor-menu',
  templateUrl: './editor-menu.component.html',
  styleUrls: ['./editor-menu.component.scss']
})
export class EditorMenuComponent implements PluginView {

  @ViewChildren(EditorMenuItemComponent) items!: QueryList<EditorMenuItemComponent>;

  protected view?: EditorView;

  constructor() { }

  protected executeCommand(command: Command, view: EditorView): void {
    command(view.state, view.dispatch, this.view);
  }

  /******************* ProseMirror Plugin creation & PluginView methods *******************/

  /**
   * Create a plugin for ProseMirror containing the current component
   * @return Plugin with current component as a PluginView
   */
  public asPlugin(): Plugin {
    const editorMenu: EditorMenuComponent = this;

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
        const markItem = item as EditorMenuItemComponent<MarkType>;
        markItem.status = this.calculateMarkStatus(markItem, marks.active, state);
      }
      else if (nodes.values[type]) {
        const nodeItem = item as EditorMenuItemComponent<NodeType>;
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
  private calculateMarkStatus(item: EditorMenuItemComponent<MarkType>, activeMarks: Mark[], state: EditorState): EditorMenuItemStatus {
    const isActive = !!activeMarks.find(mark => ProseMirrorHelper.areMarkTypesEquals(mark.type, item.type));
    const isEnabled = item.command(state, undefined, this.view);

    return isActive ? EditorMenuItemStatus.ACTIVE : (isEnabled ? EditorMenuItemStatus.ENABLED : EditorMenuItemStatus.DISABLED);
  }

  /**
   * Calculates node item status given current active & available nodes
   * @param item Node item
   * @param activeNodes Active nodes
   * @param state State of the editor
   * @private
   */
  private calculateNodeStatus(item: EditorMenuItemComponent<NodeType>, activeNodes: Node[], state: EditorState): EditorMenuItemStatus {
    const isActive = !!activeNodes.find(node => ProseMirrorHelper.areNodesEquals(node, item));
    const isEnabled = item.command(state, undefined, this.view);

    return isActive ? EditorMenuItemStatus.ACTIVE : (isEnabled ? EditorMenuItemStatus.ENABLED : EditorMenuItemStatus.DISABLED);
  }


}
