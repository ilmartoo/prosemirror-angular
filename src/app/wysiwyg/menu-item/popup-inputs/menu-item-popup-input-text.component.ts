import {Component, Input} from '@angular/core';
import {MenuItemPopupInputComponent} from './menu-item-popup-input.component';

@Component({
  selector: 'app-menu-item-popup-input',
  templateUrl: './menu-item-popup-input-text.component.html',
  styleUrls: ['./menu-item-popup-input-text.component.scss'],
  providers: [{provide: MenuItemPopupInputComponent, useExisting: MenuItemPopupInputTextComponent}]
})
export class MenuItemPopupInputTextComponent extends MenuItemPopupInputComponent {

  @Input({ required: true }) label!: string;
}
