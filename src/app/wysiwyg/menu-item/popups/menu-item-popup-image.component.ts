import {MenuItemPopupForActionComponent} from './menu-item-popup-for-action.component';
import {Component} from '@angular/core';
import {EditorState} from 'prosemirror-state';
import {MarkType} from 'prosemirror-model';
import {areNodeTypesEquals, isAtomNodeBetween} from '../../utilities/nodes-helper';
import {nodeTypes} from '../../text-editor/custom-schema';

@Component({
  selector: 'app-menu-item-popup-image',
  templateUrl: './menu-item-popup-image.component.html',
  styleUrls: ['./menu-item-action-popup.component.scss'],
})
export class MenuItemPopupImageComponent extends MenuItemPopupForActionComponent<MarkType> {
  protected readonly INPUTS = {
    TITLE: 'title',
    REFERENCE: 'reference',
  }

  protected selection?:
    | { from: number, to: number, isImage: true }
    | { from: number, to?: number, isImage: false };

  protected override reset(state: EditorState) {
    const selection = state.selection;
    const atomNode = isAtomNodeBetween(selection.$from, selection.$to);

    // Formula selected
    if (atomNode && areNodeTypesEquals(atomNode.type, nodeTypes.image)) {
      this.setValue(this.INPUTS.TITLE, atomNode.attrs['title'] || '');
      this.setValue(this.INPUTS.REFERENCE, atomNode.attrs['src'] || '');

      this.selection = {
        from: atomNode.before,
        to: atomNode.after,
        isImage: true,
      };
      return;
    }
    // No formula selected
    else {
      this.setValue(this.INPUTS.TITLE, '');
      this.setValue(this.INPUTS.REFERENCE, '');

      this.selection = {
        from: selection.from,
        to: selection.to,
        isImage: false,
      };
    }

  }

  protected override validate(): boolean {
    return (this.isValid = !!this.values[this.INPUTS.TITLE] && !!this.values[this.INPUTS.REFERENCE])
  }

  protected override transformValuesForOutput(inputs: { [input: string]: string }): { [input: string]: any } {
    return {
      title: inputs[this.INPUTS.TITLE],
      src: inputs[this.INPUTS.REFERENCE],
      from: this.selection!.from,
      to: this.selection!.to,
    };
  }
}
