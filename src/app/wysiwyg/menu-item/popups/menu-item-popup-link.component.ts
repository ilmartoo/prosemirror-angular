import {MenuItemActionPopupComponent} from './menu-item-action-popup.component';
import {Component} from '@angular/core';

@Component({
  selector: 'app-menu-item-popup-link',
  templateUrl: './menu-item-popup-link.component.html',
  styleUrls: ['./menu-item-action-popup.component.scss'],
})
export class MenuItemPopupLinkComponent extends MenuItemActionPopupComponent {
  protected readonly INPUTS = {
    NAME: 'name',
    REFERENCE: 'reference',
  }

  protected override reset() {
    this.setValue(this.INPUTS.NAME, '');
    this.setValue(this.INPUTS.REFERENCE, '');
  }

  protected override validate() {
    this.isValid = !!this.getValue(this.INPUTS.NAME) && !!this.getValue(this.INPUTS.REFERENCE)
  }

  protected override transformValuesForOutput(inputs: { [input: string]: string }): { [input: string]: string } {
    return {
      title: inputs[this.INPUTS.NAME],
      alt: inputs[this.INPUTS.NAME],
      href: inputs[this.INPUTS.REFERENCE],
    };
  }

  protected override acceptPopupLabel(): string {
    return 'Create';
  }
}
