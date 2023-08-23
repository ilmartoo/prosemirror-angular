import {MenuItemPopupForActionComponent} from './menu-item-popup-for-action.component';
import {Component} from '@angular/core';
import {MarkType} from 'prosemirror-model';
import {ColorPalette, cssColor, hexColor} from '../../utilities/color';
import {EditorState} from 'prosemirror-state';
import {retrieveActiveElements} from '../../menu/menu.component';
import {markTypes} from '../../text-editor/custom-schema';

@Component({
  selector: 'app-menu-item-popup-font-background',
  templateUrl: './menu-item-popup-font-background.component.html',
  styleUrls: ['./menu-item-action-popup.component.scss', './menu-item-popup-font-background.component.scss'],
})
export class MenuItemPopupFontBackgroundComponent extends MenuItemPopupForActionComponent<MarkType> {
  protected readonly INPUTS = {
    CLEAR: 'clear',
    COLOR: 'color',
    PICKER: 'picker',
  }

  protected readonly palette: ColorPalette = {
    list: [
			cssColor('black', { tooltip: 'Black', dark: true }),
			hexColor('#2a2a2a', { tooltip: 'Dark grey 2', dark: true }),
			hexColor('#555555', { tooltip: 'Dark grey 1', dark: true }),
			cssColor('grey', { tooltip: 'Grey', dark: true }),
			hexColor('#aaaaaa', { tooltip: 'Light grey 2' }),
			hexColor('#d5d5d5', { tooltip: 'Light grey 1', framed: true }),
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

  private inputUsed?: string; // Defines the way to obtain the selected color

  protected colorCleared() {
    this.inputUsed = this.INPUTS.CLEAR;
    this.acceptPopup();
  }

  protected colorClicked() {
    this.inputUsed = this.INPUTS.COLOR;
    this.acceptPopup();
  }

  protected colorPicked() {
    this.inputUsed = this.INPUTS.PICKER;
    this.acceptPopup();
  }

  protected override reset(state: EditorState) {
    this.inputUsed = undefined;
    const elements = retrieveActiveElements(state);

    const bgColorMark = elements.hasMarkType(markTypes.font_background);
    let color = bgColorMark?.attrs['color'] as string || '';
    this.setValue(this.INPUTS.COLOR, color);
  }

  protected override transformValuesForOutput(inputs: { [input: string]: string }): { [input: string]: any } {
    let color: string | undefined = undefined;
    if (this.inputUsed === this.INPUTS.CLEAR) { color = undefined; }
    else if (this.inputUsed === this.INPUTS.COLOR) { color = inputs[this.INPUTS.COLOR] || undefined; }
    else if (this.inputUsed === this.INPUTS.PICKER) { color = inputs[this.INPUTS.PICKER] || undefined; }

    return { color };
  }
}
