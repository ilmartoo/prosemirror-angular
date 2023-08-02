import {Component, Input} from '@angular/core';

@Component({
  selector: 'app-menu-item-popup-input',
  template: '',
})
export class MenuItemPopupInputComponent {

  @Input({ required: true }) name!: string;

  protected _value: string = '';

  get value(): string {
    return this._value;
  }

  set value(value: string) {
    this._value = value;
  }
}
