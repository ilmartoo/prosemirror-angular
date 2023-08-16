import {MenuItemPopupForActionComponent} from './menu-item-popup-for-action.component';
import {Component} from '@angular/core';
import {EditorState} from 'prosemirror-state';
import {MarkType} from 'prosemirror-model';

@Component({
  selector: 'app-menu-item-popup-link',
  templateUrl: './menu-item-popup-formula.component.html',
  styleUrls: ['./menu-item-action-popup.component.scss'],
})
export class MenuItemPopupFormulaComponent extends MenuItemPopupForActionComponent<MarkType> {
  protected readonly INPUTS = {
    FORMULA: 'formula',
  }

  protected override reset(state: EditorState) {
    this.setValue(this.INPUTS.FORMULA, '');
  }

  protected override validate(): boolean {
    return (this.isValid = !!this.values[this.INPUTS.FORMULA])
  }

  protected override transformValuesForOutput(inputs: { [input: string]: string }): { [input: string]: any } {
    return {
      formula: inputs[this.INPUTS.FORMULA],
    };
  }
}
