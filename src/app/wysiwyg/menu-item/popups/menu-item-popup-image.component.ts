import {MenuItemActionPopupComponent} from './menu-item-action-popup.component';
import {Component} from '@angular/core';
import {EditorState} from 'prosemirror-state';
import {MarkType} from 'prosemirror-model';

@Component({
  selector: 'app-menu-item-popup-image',
  templateUrl: './menu-item-popup-image.component.html',
  styleUrls: ['./menu-item-action-popup.component.scss'],
})
export class MenuItemPopupImageComponent extends MenuItemActionPopupComponent<MarkType> {
  protected readonly INPUTS = {
    TITLE: 'title',
    REFERENCE: 'reference',
  }

  protected override reset(state: EditorState) {
    this.setValue(this.INPUTS.TITLE, '');
    this.setValue(this.INPUTS.REFERENCE, '');
  }

  protected override validate() {
    this.isValid = !!this.getValue(this.INPUTS.TITLE) && !!this.getValue(this.INPUTS.REFERENCE)
  }

  protected override transformValuesForOutput(inputs: { [input: string]: string }): { [input: string]: any } {
    return {
      title: inputs[this.INPUTS.TITLE],
      src: inputs[this.INPUTS.REFERENCE],
    };
  }

  protected override acceptPopupLabel(): string {
    return 'Insert image';
  }
}
