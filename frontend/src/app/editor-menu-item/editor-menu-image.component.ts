import {Component, ElementRef, Input, ViewChild} from '@angular/core';
import {EditorMenuItemComponent} from './editor-menu-item.component';
import {insertContent} from '../rich-text-editor/custom-commands';
import {NodeType} from 'prosemirror-model';
import {customSchema} from '../rich-text-editor/custom-schema';

@Component({
  selector: 'app-editor-menu-image',
  templateUrl: './editor-menu-image.component.html',
  styleUrls: ['./editor-menu-item.component.scss', './editor-menu-image.component.scss'],
  providers: [{ provide: EditorMenuItemComponent, useExisting: EditorMenuImageComponent }],
})
export class EditorMenuImageComponent extends EditorMenuItemComponent<NodeType> {

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
    this.isPopupOpen = true;

    // Display: none is active, so we wait until this style is overwritten
    setTimeout(() => this.popupRef.nativeElement.focus());

    this.resetPopup();
    this.updatePopup();

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

  private updatePopup(): void {
    const state = this.state;
    this.insertPos = state.selection.head;
  }

  protected createImage(): void {
    const src = this.srcRef.nativeElement.value.trim();
    let title: string | undefined = this.titleRef.nativeElement.value.trim();
    title = title ? title : undefined;

    // Create link & close
    if (this.isValidImage(src) && this.insertPos != null) {
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
