import {Component, Input} from '@angular/core';
import {MenuItemPopupInputComponent} from './menu-item-popup-input.component';
import {Radio, RadioValue} from '../../utilities/radio';

@Component({
  selector: 'app-menu-item-popup-input-radio',
  templateUrl: './menu-item-popup-input-radio.component.html',
  styleUrls: ['./menu-item-popup-input-radio.component.scss'],
  providers: [{provide: MenuItemPopupInputComponent, useExisting: MenuItemPopupInputRadioComponent}]
})
export class MenuItemPopupInputRadioComponent extends MenuItemPopupInputComponent {

  @Input({ required: true }) radio!: Radio;
  @Input() styles?: (radioValue: RadioValue) => string;

  protected onClick(event: MouseEvent) {
    this.value = (event.target as HTMLInputElement).value;
  }
}
