import {Component, ElementRef, Input, ViewChild} from '@angular/core';
import {MenuItemComponent, MenuItemStatus} from './menu-item.component';
import {insertTable} from '../utilities/commands';
import {customSchema} from '../text-editor/custom-schema';
import {EditorView} from 'prosemirror-view';
import {MenuNodeItemComponent} from './menu-node-item.component';
import {Command} from 'prosemirror-state';
import {EditorSelectionActiveElements} from '../menu/menu.component';
import {executeAfter} from '../utilities/multipurpose-helper';

@Component({
  selector: 'app-menu-create-table-item',
  templateUrl: './menu-create-table-item.component.html',
  styleUrls: ['./menu-item.component.scss', './menu-create-table-item.component.scss'],
  providers: [{ provide: MenuItemComponent, useExisting: MenuCreateTableItemComponent }],
})
export class MenuCreateTableItemComponent extends MenuNodeItemComponent {

  @Input({ required: false }) override type = customSchema.nodes.table;

  @ViewChild('base') baseRef!: ElementRef<HTMLDivElement>;
  @ViewChild('popup') popupRef!: ElementRef<HTMLDivElement>;
  @ViewChild('rows') rowsRef!: ElementRef<HTMLInputElement>;
  @ViewChild('cols') colsRef!: ElementRef<HTMLInputElement>;

  protected isPopupOpen = false;
  protected canCreateTable = false;
  protected insertPos?: number;

  protected override updatedCommand(view: EditorView): Command {
    return insertTable(view.state.selection.head, 1, 1);
  }

  protected override calculateStatus(view: EditorView, activeElements: EditorSelectionActiveElements): MenuItemStatus {
    const isEnabled = this.command(view.state, undefined, view);
    return isEnabled ? MenuItemStatus.ENABLED : MenuItemStatus.DISABLED;
  }

  protected openPopup(): void {
    if (this.view) {
      this.isPopupOpen = true;

      // Display: none is active, so we wait until this style is overwritten
      executeAfter(() => this.popupRef.nativeElement.focus());

      this.resetPopup();
      this.updatePopup(this.view);
    }
  }

  protected closePopup(): void {
    this.isPopupOpen = false;
    this.resetPopup();
    this.focusEditor(); // Focus text editor
  }

  protected itemFocusLost(event: FocusEvent): void {
    const newlyFocussedElement = event.relatedTarget as HTMLElement;
    if (!this.baseRef.nativeElement.contains(newlyFocussedElement)) {
      this.closePopup();
    }
  }

  private resetPopup(): void {
    this.canCreateTable = false;

    this.rowsRef.nativeElement.value = '2';
    this.colsRef.nativeElement.value = '2';
    this.validateInput();

    this.insertPos = undefined;
  }

  private updatePopup(view: EditorView): void {
    const link: { name?: string, href?: string } = { };

    const state = view.state;
    const selection = state.selection;

    this.insertPos = selection.head;
  }

  protected createTable(): void {
    const rows = +this.rowsRef.nativeElement.value.trim();
    const cols = +this.colsRef.nativeElement.value.trim();

    // Create table & close
    if (this.view && this.isValidTable(rows, cols) && this.insertPos) {
      this.executeCommand(insertTable(this.insertPos, rows, cols));
      this.closePopup(); // Exit popup
      this.focusEditor(); // Focus text editor
    }
  }

  protected isValidTable(rows: number, cols: number): boolean {
    return rows > 0 && cols > 0;
  }

  protected validateInput(): void {
    const rows = +this.rowsRef.nativeElement.value.trim();
    const cols = +this.colsRef.nativeElement.value.trim();

    this.canCreateTable = this.isValidTable(rows, cols);
  }
}
