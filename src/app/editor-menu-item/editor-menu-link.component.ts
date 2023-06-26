import {Component, ElementRef, ViewChild} from '@angular/core';
import {EditorMenuItemComponent} from './editor-menu-item.component';
import {Mark, MarkType, NodeRange, ResolvedPos} from 'prosemirror-model';
import {toggleMark} from 'prosemirror-commands';
import {EditorState} from 'prosemirror-state';
import {ProseMirrorHelper} from '../rich-text-editor/prose-mirror-helper';

@Component({
  selector: 'app-editor-menu-link',
  templateUrl: './editor-menu-link.component.html',
  styleUrls: ['./editor-menu-item.component.scss', './editor-menu-link.component.scss'],
  providers: [{ provide: EditorMenuItemComponent, useExisting: EditorMenuLinkComponent }],
})
export class EditorMenuLinkComponent extends EditorMenuItemComponent<MarkType> {

  @ViewChild('base') baseRef!: ElementRef<HTMLDivElement>;
  @ViewChild('popup') popupRef!: ElementRef<HTMLDivElement>;
  @ViewChild('linkName') nameRef!: ElementRef<HTMLInputElement>;
  @ViewChild('linkReference') hrefRef!: ElementRef<HTMLInputElement>;

  protected isPopupOpen = false;

  protected data: {
    linkMark?: Mark,
    selectedRange?: NodeRange,
    insertPos?: ResolvedPos,
  } = {};

  protected override initCommand(): void {
    this.command = toggleMark(this.type, this.attrs);
  }

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
    this.nameRef.nativeElement.readOnly = false;
    this.nameRef.nativeElement.value = '';
    this.hrefRef.nativeElement.value = '';

    this.data = {};
  }

  private updatePopupText(state: EditorState): void {
    const linkData: { name?: string, href?: string } = { };

    const selection = state.selection;
    const selectedLinkMark = ProseMirrorHelper.isMarkTypeActiveAt(this.type, selection.$head);
    const markRange = selectedLinkMark ? ProseMirrorHelper.expandMarkActiveRange(state.doc, selectedLinkMark, selection.head) : null;

    // If open when a link is on head
    if (selectedLinkMark && markRange) {
        this.data.linkMark = selectedLinkMark;
        this.data.selectedRange = markRange;

        linkData.name = state.doc.textBetween(markRange.start, markRange.end).trim();
        linkData.href = selectedLinkMark.attrs['href'] as string;
    }
    // If a selection is in place
    else if (!selection.empty) {
      this.data.selectedRange = selection.$from.blockRange(selection.$to) ?? undefined;

      linkData.name = state.doc.textBetween(selection.from, selection.to).trim();
    }
    // Else insert in cursor position
    else {
      this.data.insertPos = selection.$head;
    }

    if (linkData.name) { // Nullish check (Empty string)
      this.nameRef.nativeElement.readOnly = true;
      this.nameRef.nativeElement.value = linkData.name;

      if (linkData.href) { // Nullish check (Empty string)
        this.hrefRef.nativeElement.value = linkData.href;
      }
    }
  }

  // protected createLink(state: EditorState, dispatch?: (tr: Transaction) => void, view?: EditorView): boolean {
  //   if (!(this.data.linkMark || this.data.selectedRange || this.data.insertPos)) { return false }
  //   if (dispatch) {
  //
  //   }
  //   return true;
  // }
  //
  // protected addLink() {
  //
  //   let valid = false;
  //   if (valid) {
  //     this.executeCommand()
  //   }
  // }
}
