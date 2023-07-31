import {MenuItemPopupForActionComponent} from './menu-item-popup-for-action.component';
import {Component} from '@angular/core';
import {NodeType} from 'prosemirror-model';

@Component({
  selector: 'app-menu-item-popup-table',
  templateUrl: './menu-item-popup-table.component.html',
  styleUrls: ['./menu-item-action-popup.component.scss'],
})
export class MenuItemPopupTableComponent extends MenuItemPopupForActionComponent<NodeType> {
  protected readonly INPUTS = {
    ROWS: 'rows',
    COLS: 'cols',
  }

  protected readonly DEFAULT_ROWS = 2;
  protected readonly DEFAULT_COLS = 2;
  protected readonly MIN_ROWS = 1;
  protected readonly MIN_COLS = 1;

  protected override reset() {
    this.setValue(this.INPUTS.ROWS, `${this.DEFAULT_ROWS}`);
    this.setValue(this.INPUTS.COLS, `${this.DEFAULT_COLS}`);
  }

  protected override validate(): boolean {
    return (
      this.isValid = +this.values[this.INPUTS.ROWS] >= this.MIN_ROWS
                  && +this.values[this.INPUTS.COLS] >= this.MIN_COLS
    );
  }

  protected override transformValuesForOutput(inputs: { [input: string]: string }): { [input: string]: any } {
    return {
      rows: +inputs[this.INPUTS.ROWS],
      cols: +inputs[this.INPUTS.COLS],
    };
  }

  protected override acceptPopupLabel(): string {
    return 'Create table';
  }
}
