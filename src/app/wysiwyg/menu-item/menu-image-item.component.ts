import {Component, ElementRef, Input, ViewChild} from '@angular/core';
import {MenuItemComponent} from './menu-item.component';
import {insertContent} from '../utilities/commands';
import {customSchema} from '../text-editor/custom-schema';
import {MenuNodeItemComponent} from './menu-node-item.component';
import {EditorView} from 'prosemirror-view';

@Component({
  selector: 'app-menu-image-item',
  templateUrl: './menu-image-item.component.html',
  styleUrls: ['./menu-item.component.scss', './menu-image-item.component.scss'],
  providers: [{ provide: MenuItemComponent, useExisting: MenuImageItemComponent }],
})
export class MenuImageItemComponent extends MenuNodeItemComponent {

  @Input({ required: false }) override type = customSchema.nodes.image;

  @ViewChild('base') baseRef!: ElementRef<HTMLDivElement>;
  @ViewChild('popup') popupRef!: ElementRef<HTMLDivElement>;
  @ViewChild('imageReference') srcRef!: ElementRef<HTMLInputElement>;
  @ViewChild('imageTitle') titleRef!: ElementRef<HTMLInputElement>;

  protected isPopupOpen = false;
  protected canInsertImage = false;
  protected insertPos = 0;

  override initCommand(): void {
    this.command = (): boolean => true;
  }

  protected openPopup(): void {
    if (this.view) {
      this.isPopupOpen = true;

      // Display: none is active, so we wait until this style is overwritten
      setTimeout(() => this.popupRef.nativeElement.focus());

      this.resetPopup();
      this.updatePopup(this.view);
    }
  }

  protected closePopup(): void {
    this.isPopupOpen = false;

    this.resetPopup();
  }

  protected itemFocusLost(event: FocusEvent): void {
    const newlyFocussedElement = event.relatedTarget as HTMLElement;
    if (!this.baseRef.nativeElement.contains(newlyFocussedElement)) {
      this.closePopup();
    }
  }

  private resetPopup(): void {
    this.canInsertImage = false;

    this.srcRef.nativeElement.value = '';
    this.titleRef.nativeElement.value = '';

    this.insertPos = 0;
  }

  private updatePopup(view: EditorView): void {
    this.insertPos = view.state.selection.head;
  }

  protected createImage(): void {
    const src = this.srcRef.nativeElement.value.trim();
    let title: string | undefined = this.titleRef.nativeElement.value.trim();
    title = title ? title : undefined;

    // Create link & close
    if (this.view && this.isValidImage(src) && this.insertPos != null) {
      const imageNode = this.type.create({ src: src, alt: title, title: title });
      this.executeCommand(insertContent(this.insertPos, imageNode));
      this.closePopup(); // Exit popup
      this.focusEditor(); // Focus text editor
    }
  }

  protected isValidImage(src: string): boolean {
    return !!src;
  }

  protected validateInput(): void {
    const src = this.srcRef.nativeElement.value.trim();

    this.canInsertImage = this.isValidImage(src);
  }
}
