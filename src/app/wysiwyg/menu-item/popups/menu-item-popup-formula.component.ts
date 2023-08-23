import {MenuItemPopupForActionComponent} from './menu-item-popup-for-action.component';
import {Component} from '@angular/core';
import {EditorState} from 'prosemirror-state';
import {MarkType} from 'prosemirror-model';
import {areNodeTypesEquals, isAtomNodeBetween} from '../../utilities/nodes-helper';
import {nodeTypes} from '../../text-editor/custom-schema';

@Component({
  selector: 'app-menu-item-popup-link',
  templateUrl: './menu-item-popup-formula.component.html',
  styleUrls: ['./menu-item-action-popup.component.scss'],
})
export class MenuItemPopupFormulaComponent extends MenuItemPopupForActionComponent<MarkType> {
  protected readonly INPUTS = {
    FORMULA: 'formula',
  }

  protected selection?:
    | { from: number, to: number, isFormula: true }
    | { from: number, to?: number, isFormula: false };

  protected override reset(state: EditorState) {
    const selection = state.selection;
    const atomNode = isAtomNodeBetween(selection.$from, selection.$to);

    // Formula selected
    if (atomNode && areNodeTypesEquals(atomNode.type, nodeTypes.equation)) {
      this.setValue(this.INPUTS.FORMULA, atomNode.attrs['formula'] || '');

      this.selection = {
        from: atomNode.before,
        to: atomNode.after,
        isFormula: true,
      };
      return;
    }
    // No formula selected
    else {
      this.setValue(this.INPUTS.FORMULA, '');

      this.selection = {
        from: selection.from,
        to: selection.empty ? undefined : selection.to,
        isFormula: false,
      };
    }
  }

  protected override validate(): boolean {
    return (this.isValid = !!this.values[this.INPUTS.FORMULA])
  }

  protected override transformValuesForOutput(inputs: { [input: string]: string }): { [input: string]: any } {
    return {
      formula: inputs[this.INPUTS.FORMULA],
      from: this.selection!.from,
      to: this.selection!.to,
    };
  }
}
