import {MenuItemPopupForActionComponent} from './menu-item-popup-for-action.component';
import {Component} from '@angular/core';
import {MarkType} from 'prosemirror-model';
import {cssColor, hexColor} from '../popup-inputs/color';

@Component({
  selector: 'app-menu-item-popup-color',
  templateUrl: './menu-item-popup-color.component.html',
  styleUrls: ['./menu-item-action-popup.component.scss', './menu-item-popup-color.component.scss'],
})
export class MenuItemPopupColorComponent extends MenuItemPopupForActionComponent<MarkType> {
  protected readonly INPUTS = {
    COLOR: 'color',
  }

  protected readonly palette = {
    primary: hexColor('#000', true),
    others: [
      cssColor('white'),
      cssColor('red'),
      cssColor('orange'),
      cssColor('blue'),
      cssColor('lightgreen'),
      cssColor('green'),
    ]
  };

  protected override reset() {
    this.setValue(this.INPUTS.COLOR, `${this.palette.primary.value}`);
  }

  protected override validate(): boolean {
    return (this.isValid = true);
  }

  protected override transformValuesForOutput(inputs: { [input: string]: string }): { [input: string]: any } {
    return {
      color: inputs[this.INPUTS.COLOR] || undefined,
    };
  }

  protected get selectedColor(): string {
    const value = this.values[this.INPUTS.COLOR];

    if (this.palette.primary.value === value) { return this.palette.primary.display; }

    for (const color of this.palette.others) {
      if (color.value === value) { return color.display; }
    }

    return '';
  }
}
