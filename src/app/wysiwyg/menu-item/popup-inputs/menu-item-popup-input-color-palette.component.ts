import {Component, Input} from '@angular/core';
import {MenuItemPopupInputComponent} from './menu-item-popup-input.component';
import {ColorPalette} from './color';

@Component({
  selector: 'app-menu-item-popup-input-color-palette',
  templateUrl: './menu-item-popup-input-color-palette.component.html',
  styleUrls: ['./menu-item-popup-input-color-palette.component.scss'],
  providers: [{provide: MenuItemPopupInputComponent, useExisting: MenuItemPopupInputColorPaletteComponent}]
})
export class MenuItemPopupInputColorPaletteComponent extends MenuItemPopupInputComponent {

  @Input({ required: true }) palette!: ColorPalette;
}
