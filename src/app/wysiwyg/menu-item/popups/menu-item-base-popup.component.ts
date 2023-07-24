import {Component, Input} from '@angular/core';

@Component({
  selector: 'app-menu-item-base-popup',
  templateUrl: './menu-item-base-popup.component.html',
  styleUrls: ['./menu-item-base-popup.component.scss'],
})
export class MenuItemBasePopupComponent {
  @Input({ required: true }) isOpened!: boolean;
}
