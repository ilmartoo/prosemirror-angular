import {MenuItemActionPopupComponent} from '../menu-item-action-popup.component';
import {Component} from '@angular/core';

@Component({
  selector: 'app-menu-item-popup-link',
  templateUrl: './menu-item-popup-link.component.html',
  styleUrls: ['./menu-item-popup.component.scss'],
})
export class MenuItemPopupLinkComponent extends MenuItemActionPopupComponent {
  protected override reset() {
    this.setValue('name', '');
    this.setValue('reference', '');
  }

  protected override validate() {
    return !!this.getValue('name') && !!this.getValue('reference')
  }

  protected override acceptPopupLabel(): string {
    return 'Create';
  }
}
