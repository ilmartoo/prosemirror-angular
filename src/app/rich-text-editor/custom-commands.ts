import {Command, EditorState, TextSelection, Transaction} from 'prosemirror-state';
import {Mark} from 'prosemirror-model';

/**
 * Selects the text of the given range
 * @param from Start of the range (exclusive)
 * @param to End of the range (exclusive)
 * @returns Command to select the text between the given positions
 */
export function selectRange(from: number, to: number): Command {
  if (from > to) {
    return selectRange(to, from);
  }

  return function(state: EditorState, dispatch?: (tr: Transaction) => void): boolean {
    if (dispatch) {
      const tr = state.tr;
      tr.setSelection(TextSelection.create(state.doc, from, to));
      dispatch(tr);
    }
    return true;
  }
}

/**
 * Creates a link in the given selection or inserts a link at the given position
 * @param linkName Link name & title
 * @param linkMark Link mark to apply
 * @param from Start of the range (exclusive)
 * @param to End of the range (exclusive)
 * @returns Command to create a link
 */
export function createLink(linkName: string, linkMark: Mark, from: number, to?: number): Command {
  if (to && from > to) {
    return createLink(linkName, linkMark, to, from);
  }

  return function(state: EditorState, dispatch?: (tr: Transaction) => void): boolean {
    if (!linkName || !linkMark.attrs['href']) { return false; } // Name or Href may not be empty
    if (dispatch) {
      const tr = state.tr;

      // Update existing link OR add link to selection
      if (to) {
        tr.setSelection(TextSelection.create(state.doc, from, to));
        tr.removeMark(from, to, linkMark.type);
        tr.replaceSelectionWith(state.schema.text(linkName), true);
        tr.addMark(from, tr.selection.to, linkMark);
      }
      // Insert new text as link
      else {
        tr.addStoredMark(linkMark);
        tr.insertText(linkName, from);
      }

      dispatch(tr);
    }
    return true;
  }
}
