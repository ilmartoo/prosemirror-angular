import {Component, Input} from '@angular/core';

@Component({
  selector: 'app-menu-item-popup',
  templateUrl: './menu-item-popup.component.html',
  styleUrls: ['./menu-item-popup.component.scss'],
})
export class MenuItemPopupComponent {
  @Input({ required: true }) isOpened!: boolean;
}
