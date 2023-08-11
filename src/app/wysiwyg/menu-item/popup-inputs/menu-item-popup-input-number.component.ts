import {Component, Input} from '@angular/core';
import {MenuItemPopupInputComponent} from './menu-item-popup-input.component';

@Component({
  selector: 'app-menu-item-popup-input-number',
  templateUrl: './menu-item-popup-input-number.component.html',
  styleUrls: ['./menu-item-popup-input-text.component.scss'],
  providers: [{provide: MenuItemPopupInputComponent, useExisting: MenuItemPopupInputNumberComponent}]
})
export class MenuItemPopupInputNumberComponent extends MenuItemPopupInputComponent {

  @Input({ required: true }) label!: string;
  @Input() min!: number;
  @Input() max!: number;
}
