import {Component, ElementRef, ViewChild} from '@angular/core';
import {EditorMenuItemComponent} from './editor-menu-item.component';
import {EditorState} from 'prosemirror-state';
import {ProseMirrorHelper} from '../rich-text-editor/prose-mirror-helper';
import {createLink, removeMark} from '../rich-text-editor/custom-commands';
import {EditorMenuMarkComponent} from './editor-menu-mark.component';

@Component({
  selector: 'app-editor-menu-link',
  templateUrl: './editor-menu-link.component.html',
  styleUrls: ['./editor-menu-item.component.scss', './editor-menu-link.component.scss'],
  providers: [{ provide: EditorMenuItemComponent, useExisting: EditorMenuLinkComponent }],
})
export class EditorMenuLinkComponent extends EditorMenuMarkComponent {

  @ViewChild('base') baseRef!: ElementRef<HTMLDivElement>;
  @ViewChild('popup') popupRef!: ElementRef<HTMLDivElement>;
  @ViewChild('linkName') nameRef!: ElementRef<HTMLInputElement>;
  @ViewChild('linkReference') hrefRef!: ElementRef<HTMLInputElement>;

  protected isPopupOpen = false;
  protected canCreateLink = false;
  protected selection?:
    { isLink: true, from: number, to: number } |
    { isLink: false, from: number, to?: number };

  protected openPopup(): void {
    this.isPopupOpen = true;

    // Display: none is active, so we wait until this style is overwritten
    setTimeout(() => this.popupRef.nativeElement.focus());

    this.resetPopup();

    this.updatePopupText(this.view.state);
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
    this.canCreateLink = false;

    this.nameRef.nativeElement.readOnly = false;
    this.nameRef.nativeElement.value = '';
    this.hrefRef.nativeElement.value = '';

    this.selection = undefined;
  }

  private updatePopupText(state: EditorState): void {
    const link: { name?: string, href?: string } = { };

    const selection = state.selection;
    const selectedLink = ProseMirrorHelper.searchForMarkTypeInSelection(this.type, state);
    const markRange = selectedLink ? ProseMirrorHelper.expandMarkActiveRange(state.doc, selectedLink.mark, selectedLink.resolvedPos.pos) : null;

    // If open when a link is on head
    if (selectedLink && markRange) {
      this.selection = {
        isLink: true,
        from: markRange.$from.pos,
        to: markRange.$to.pos,
      };

      link.name = ProseMirrorHelper.textAt(state.doc, markRange.start, markRange.end).trim();
      link.href = selectedLink.mark.attrs['href'] as string;
      this.canCreateLink = true;
    }
    // If a selection is in place but does not contain a link
    else if (!selection.empty) {
      this.selection = {
        isLink: false,
        from: selection.$from.pos,
        to: selection.$to.pos,
      };

      link.name = ProseMirrorHelper.textAt(state.doc, selection.from, selection.to).trim()
    }
    // Else insert in cursor position
    else {
      this.selection = {
        isLink: false,
        from: selection.$head.pos,
      };
    }

    if (link.name) { // Nullish check (Empty string)
      // this.nameRef.nativeElement.readOnly = true;
      this.nameRef.nativeElement.value = link.name;

      if (link.href) { // Nullish check (Empty string)
        this.hrefRef.nativeElement.value = link.href;
      }
    }
  }

  protected createLink(): void {
    const name = this.nameRef.nativeElement.value.trim();
    const href = this.hrefRef.nativeElement.value.trim();

    // Create link & close
    if (this.validLink(name, href) && this.selection) {
      const mark = this.type.create({ href: href, title: name });
      this.executeCommand(createLink(name, mark, this.selection.from, this.selection.to));
      this.closePopup(); // Exit popup
      this.view.focus(); // Focus text editor
    }
  }

  protected deleteLink(): void {
    // Delete link & close
    if (this.selection?.isLink) {
      this.executeCommand(removeMark(this.selection.from, this.selection.to, this.type));
      this.closePopup(); // Exit popup
      this.view.focus(); // Focus text editor
    }
  }

  protected validLink(name: string, href: string): boolean {
    return !!name && !!href;
  }

  protected onInput(): void {
    const name = this.nameRef.nativeElement.value.trim();
    const href = this.hrefRef.nativeElement.value.trim();

    this.canCreateLink = this.validLink(name, href);
  }
}
