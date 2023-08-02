import {MenuItemPopupForActionComponent} from './menu-item-popup-for-action.component';
import {Component} from '@angular/core';
import {EditorState} from 'prosemirror-state';
import {expandMarkActiveRange, searchForMarkTypeInSelection} from '../../utilities/marks-helper';
import {MarkType} from 'prosemirror-model';
import {textBetween} from '../../utilities/node-content-helper';

@Component({
  selector: 'app-menu-item-popup-link',
  templateUrl: './menu-item-popup-link.component.html',
  styleUrls: ['./menu-item-action-popup.component.scss'],
})
export class MenuItemPopupLinkComponent extends MenuItemPopupForActionComponent<MarkType> {
  protected readonly INPUTS = {
    TITLE: 'title',
    REFERENCE: 'reference',
  }

  protected selection?:
    | { from: number, to: number, isLink: true }
    | { from: number, to?: number, isLink: false };

  protected override reset(state: EditorState) {
    const selection = state.selection;
    const selectedLink = searchForMarkTypeInSelection(this.type, state);
    const markRange = selectedLink ? expandMarkActiveRange(state.doc, selectedLink, selectedLink.pos) : null;

    // If open when a link is on head
    if (selectedLink && markRange) {
      this.setValue(this.INPUTS.TITLE, textBetween(state.doc, markRange.start, markRange.end));
      this.setValue(this.INPUTS.REFERENCE, selectedLink.attrs['href'] as string);

      this.selection = {
        from: markRange.start,
        to: markRange.end,
        isLink: true,
      };
    }
    // Check if a selection is in place but does not contain a link
    else if (!selection.empty) {
      this.setValue(this.INPUTS.TITLE, textBetween(state.doc, selection.from, selection.to));
      this.setValue(this.INPUTS.REFERENCE, '');

      this.selection = {
        from: selection.from,
        to: selection.to,
        isLink: false,
      };
    }
    else {
      this.setValue(this.INPUTS.TITLE, '');
      this.setValue(this.INPUTS.REFERENCE, '');

      this.selection = {
        from: selection.from,
        isLink: false,
      };
    }
  }

  protected override validate(): boolean {
    return (this.isValid = !!this.values[this.INPUTS.TITLE] && !!this.values[this.INPUTS.REFERENCE])
  }

  protected override transformValuesForOutput(inputs: { [input: string]: string }): { [input: string]: any } {
    return {
      title: inputs[this.INPUTS.TITLE],
      href: inputs[this.INPUTS.REFERENCE],
      from: this.selection!.from,
      to: this.selection!.to,
    };
  }
}
