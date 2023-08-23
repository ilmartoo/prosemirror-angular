import {MenuItemPopupForActionComponent} from './menu-item-popup-for-action.component';
import {Component} from '@angular/core';
import {MarkType} from 'prosemirror-model';
import {ColorPalette, cssColor, hexColor} from '../../utilities/color';
import {EditorState} from 'prosemirror-state';
import {retrieveActiveElements} from '../../menu/menu.component';
import {markTypes} from '../../text-editor/custom-schema';

@Component({
  selector: 'app-menu-item-popup-font-color',
  templateUrl: './menu-item-popup-font-color.component.html',
  styleUrls: ['./menu-item-action-popup.component.scss'],
})
export class MenuItemPopupFontColorComponent extends MenuItemPopupForActionComponent<MarkType> {
  protected readonly INPUTS = {
    COLOR: 'color',
  }

  protected readonly palette: ColorPalette = {
    list: [
      cssColor('black', { tooltip: 'Black', dark: true, default: true }),
      hexColor('#2a2a2a', { tooltip: 'Darker grey', dark: true }),
      hexColor('#555555', { tooltip: 'Dark grey', dark: true }),
      cssColor('grey', { tooltip: 'Grey', dark: true }),
      hexColor('#aaaaaa', { tooltip: 'Light grey' }),
      hexColor('#d5d5d5', { tooltip: 'Lighter grey', framed: true }),
      cssColor('white', { tooltip: 'White', framed: true }),
      cssColor('red', { tooltip: 'Red', dark: true }),
      cssColor('orange', { tooltip: 'Orange' }),
			cssColor('yellow', { tooltip: 'Yellow', framed: true }),
      cssColor('lime', { tooltip: 'Lime' }),
      cssColor('cyan', { tooltip: 'Cyan' }),
      cssColor('blue', { tooltip: 'Blue', dark: true }),
      cssColor('magenta', { tooltip: 'Magenta', dark: true }),
      cssColor('darkred', { tooltip: 'Dark red', dark: true }),
      cssColor('peru', { tooltip: 'Dark orange', dark: true }),
      hexColor('#baa300', { tooltip: 'Dark yellow', dark: true }),
      cssColor('green', { tooltip: 'Green', dark: true }),
      cssColor('teal', { tooltip: 'Teal', dark: true }),
			cssColor('navy', { tooltip: 'Navy blue', dark: true }),
      cssColor('purple', { tooltip: 'Purple', dark: true }),
    ]
  };

  protected override reset(state: EditorState) {
    const elements = retrieveActiveElements(state);

    const txtColorMark = elements.hasMarkType(markTypes.font_color);
    let color = txtColorMark?.attrs['color'] as string || '';
    this.setValue(this.INPUTS.COLOR, color);
  }

  protected override transformValuesForOutput(inputs: { [input: string]: string }): { [input: string]: any } {
    return {
      color: inputs[this.INPUTS.COLOR] || undefined,
    };
  }
}
