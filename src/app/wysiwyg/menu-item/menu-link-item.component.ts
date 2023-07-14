import {Component, ElementRef, Input, ViewChild} from '@angular/core';
import {MenuItemComponent} from './menu-item.component';
import {replaceWithMarkedText} from '../utilities/commands';
import {MenuMarkItemComponent} from './menu-mark-item.component';
import {customSchema} from '../text-editor/custom-schema';
import {EditorView} from 'prosemirror-view';
import {expandMarkActiveRange, searchForMarkTypeInSelection} from "../utilities/marks-helper";
import {textBetween} from "../utilities/node-content-helper";
import {executeAfter} from '../utilities/multipurpose-helper';

@Component({
  selector: 'app-menu-link-item',
  templateUrl: './menu-link-item.component.html',
  styleUrls: ['./menu-item.component.scss', './menu-link-item.component.scss'],
  providers: [{ provide: MenuItemComponent, useExisting: MenuLinkItemComponent }],
})
export class MenuLinkItemComponent extends MenuMarkItemComponent {

  @Input({ required: false }) override type = customSchema.marks.link;

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
    this.canCreateLink = false;

    this.nameRef.nativeElement.value = '';
    this.hrefRef.nativeElement.value = '';

    this.selection = undefined;
  }

  private updatePopup(view: EditorView): void {
    const link: { name?: string, href?: string } = { };

    const state = view.state;
    const selection = state.selection;

    const selectedLink = searchForMarkTypeInSelection(this.type, state);
    const markRange = selectedLink ? expandMarkActiveRange(state.doc, selectedLink, selectedLink.pos) : null;

    // If open when a link is on head
    if (selectedLink && markRange) {
      this.selection = {
        isLink: true,
        from: markRange.$from.pos,
        to: markRange.$to.pos,
      };

      link.name = textBetween(state.doc, markRange.start, markRange.end).trim();
      link.href = selectedLink.attrs['href'] as string;
      this.canCreateLink = true;
    }
    // If a selection is in place but does not contain a link
    else if (!selection.empty) {
      this.selection = {
        isLink: false,
        from: selection.$from.pos,
        to: selection.$to.pos,
      };

      link.name = textBetween(state.doc, selection.from, selection.to).trim()
    }
    // Else insert in cursor position
    else {
      this.selection = {
        isLink: false,
        from: selection.$head.pos,
      };
    }

    if (link.name) { // Nullish check (Empty string)
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
    if (this.view && this.isValidLink(name, href) && this.selection) {
      const linkMark = this.type.create({ href: href, title: href });
      this.executeCommand(replaceWithMarkedText(name, [linkMark], this.selection.from, this.selection.to));
      this.closePopup(); // Exit popup
      this.focusEditor(); // Focus text editor
    }
  }

  protected isValidLink(name: string, href: string): boolean {
    return !!name && !!href;
  }

  protected validateInput(): void {
    const name = this.nameRef.nativeElement.value.trim();
    const href = this.hrefRef.nativeElement.value.trim();

    this.canCreateLink = this.isValidLink(name, href);
  }

  protected getButtonLabel(): string {
    return this.selection?.isLink ? 'Modify' : 'Create';
  }
}
