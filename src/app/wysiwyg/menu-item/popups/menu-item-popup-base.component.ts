import {Component, Input} from '@angular/core';

@Component({
  selector: 'app-menu-item-base-popup',
  templateUrl: './menu-item-popup-base.component.html',
  styleUrls: ['./menu-item-popup-base.component.scss'],
})
export class MenuItemPopupBaseComponent {
  @Input({ required: true }) isOpened!: boolean;
}
