import {Component, ElementRef, ViewChild} from '@angular/core';
import {EditorMenuItemComponent} from './editor-menu-item.component';
import {ResolvedPos} from 'prosemirror-model';
import {EditorState} from 'prosemirror-state';
import {ProseMirrorHelper} from '../rich-text-editor/prose-mirror-helper';
import {createLink, selectRange} from '../rich-text-editor/custom-commands';
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

  protected range: {
    from?: number,
    to?: number,
  } = {};

  protected openPopup(): void {
    this.isPopupOpen = true;

    // Display: none is active, so we wait until this style is overwritten
    setTimeout(() => this.popupRef.nativeElement.focus());

    this.resetPopup();

    const state = this.view.state;
    this.updatePopupText(state);

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

    this.range = {};
  }

  private updatePopupText(state: EditorState): void {
    const link: { name?: string, href?: string } = { };

    const selection = state.selection;
    const selectedLink = ProseMirrorHelper.searchForMarkTypeInSelection(this.type, state);
    const markRange = selectedLink ? ProseMirrorHelper.expandMarkActiveRange(state.doc, selectedLink.mark, selectedLink.resolvedPos.pos) : null;

    // If open when a link is on head
    if (selectedLink && markRange) {
      this.range.from = markRange.$from.pos - 1;
      this.range.to = markRange.$to.pos + 1;

      this.selectLinkText(markRange.$from, markRange.$to);

      link.name = state.doc.textBetween(markRange.start, markRange.end).trim();
      link.href = selectedLink.mark.attrs['href'] as string;
      this.canCreateLink = true;
    }
    // If a selection is in place
    else if (!selection.empty) {
      this.range.from = selection.$from.pos - 1;
      this.range.to = selection.$to.pos + 1;

      link.name = state.doc.textBetween(selection.from, selection.to).trim();
    }
    // Else insert in cursor position
    else {
      this.range.from = selection.$head.pos;
    }

    if (link.name) { // Nullish check (Empty string)
      // this.nameRef.nativeElement.readOnly = true;
      this.nameRef.nativeElement.value = link.name;

      if (link.href) { // Nullish check (Empty string)
        this.hrefRef.nativeElement.value = link.href;
      }
    }
  }

  protected selectLinkText($from: ResolvedPos, $to: ResolvedPos): void {
    this.executeCommand(selectRange($from.pos - 1, $to.pos + 1));
  }

  protected createLink(): void {
    const name = this.nameRef.nativeElement.value.trim();
    const href = this.hrefRef.nativeElement.value.trim();

    // Create & close
    if (name && href && this.range.from) {
      const mark = this.type.create({ href: href, title: name });
      this.executeCommand(createLink(name, mark, this.range.from, this.range.to));
      this.closePopup();
    }
    // This should not happen, but who knows...
    else {
      this.canCreateLink = false;
    }
  }

  protected onInput(): void {
    const name = this.nameRef.nativeElement.value.trim();
    const href = this.hrefRef.nativeElement.value.trim();

    this.canCreateLink = !!name && !!href;
  }
}
