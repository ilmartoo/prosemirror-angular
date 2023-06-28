import {Component, ElementRef, ViewChild} from '@angular/core';
import {EditorMenuItemComponent} from './editor-menu-item.component';
import {NodeType} from 'prosemirror-model';

@Component({
  selector: 'app-editor-menu-image',
  templateUrl: './editor-menu-image.component.html',
  styleUrls: ['./editor-menu-item.component.scss', './editor-menu-image.component.scss'],
  providers: [{ provide: EditorMenuItemComponent, useExisting: EditorMenuImageComponent }],
})
export class EditorMenuImageComponent extends EditorMenuItemComponent<NodeType> {

  @ViewChild('base') baseRef!: ElementRef<HTMLDivElement>;
  @ViewChild('popup') popupRef!: ElementRef<HTMLDivElement>;

  protected isPopupOpen = false;
  protected canCreateLink = false;
  protected selection?:
    { isLink: true, from: number, to: number } |
    { isLink: false, from: number, to?: number };

  protected openPopup(): void {
    this.isPopupOpen = true;

    // Display: none is active, so we wait until this style is overwritten
    setTimeout(() => this.popupRef.nativeElement.focus());

    // this.resetPopup();

    const state = this.view.state;
    // this.updatePopupText(state);

  }

  protected closePopup(): void {
    this.isPopupOpen = false;

    // this.resetPopup();
  }

  protected itemFocusLost(event: FocusEvent): void {
    const newlyFocussedElement = event.relatedTarget as HTMLElement;
    if (!this.baseRef.nativeElement.contains(newlyFocussedElement)) {
      this.closePopup();
    }
  }

  // private resetPopup(): void {
  //   this.canCreateLink = false;
  //
  //   this.nameRef.nativeElement.readOnly = false;
  //   this.nameRef.nativeElement.value = '';
  //   this.hrefRef.nativeElement.value = '';
  // }
}
