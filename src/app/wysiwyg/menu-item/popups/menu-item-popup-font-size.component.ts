import {MenuItemPopupForActionComponent} from './menu-item-popup-for-action.component';
import {Component} from '@angular/core';
import {MarkType} from 'prosemirror-model';
import {EditorState} from 'prosemirror-state';
import {retrieveActiveElements} from '../../menu/menu.component';
import {markTypes} from '../../text-editor/custom-schema';
import {Radio, radioDefaultValue, radioValue} from '../../utilities/radio';

@Component({
  selector: 'app-menu-item-popup-font-size',
  templateUrl: './menu-item-popup-font-size.component.html',
  styleUrls: ['./menu-item-action-popup.component.scss'],
})
export class MenuItemPopupFontSizeComponent extends MenuItemPopupForActionComponent<MarkType> {
  protected readonly INPUTS = {
    RADIO: 'radio',
  }

  protected readonly radio: Radio = [
    radioValue('8', '8px'),
    radioValue('9', '9px'),
    radioValue('10', '10px'),
    radioValue('11', '11px'),
    radioValue('12', '12px'),
    radioValue('14', '14px'),
    radioDefaultValue('16'),
    radioValue('18', '18px'),
    radioValue('24', '24px'),
    radioValue('30', '30px'),
    radioValue('36', '36px'),
    radioValue('48', '48px'),
  ];

  protected override reset(state: EditorState) {
    const elements = retrieveActiveElements(state);

    const sizeMark = elements.hasMarkType(markTypes.font_size);
    let size = sizeMark?.attrs['size'] as string || '';
    this.setValue(this.INPUTS.RADIO, size);
  }

  protected override transformValuesForOutput(inputs: { [input: string]: string }): { [input: string]: any } {
    return {
      size: inputs[this.INPUTS.RADIO] || undefined,
    };
  }
}
