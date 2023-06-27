import {Command, EditorState, TextSelection, Transaction} from 'prosemirror-state';
import {Mark, MarkType} from 'prosemirror-model';

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
      tr.setSelection(TextSelection.create(tr.doc, from, to));
      dispatch(tr.scrollIntoView());
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
        tr.setSelection(TextSelection.create(tr.doc, from, to));
        tr.removeMark(from, to, linkMark.type);
        tr.addStoredMark(linkMark);
        tr.replaceSelectionWith(state.schema.text(linkName), true);
      }
      // Insert new text as link
      else {
        tr.addStoredMark(linkMark);
        tr.insertText(linkName, from);
      }
      tr.setSelection(TextSelection.create(tr.doc, from, tr.selection.to));

      dispatch(tr.scrollIntoView());
    }
    return true;
  }
}

/**
 * Remove marks from inline nodes between from and to
 * - When mark is a single mark, remove precisely that mark
 * - When it is a mark type, remove all marks of that type
 * - When it is null, remove all marks of any type
 * @param from Start of the selection
 * @param to End of the selection
 * @param mark Mark or mark type to remove. All if null or undefined
 * @returns Command to remove the mark, mark type or all marks in the selection
 */
export function removeMark(from: number, to: number, mark?: Mark | MarkType | null): Command {
  if (from > to) {
    return removeMark(to, from, mark);
  }

  return function(state: EditorState, dispatch?: (tr: Transaction) => void): boolean {
    if (dispatch) {
      const tr = state.tr;
      tr.removeMark(from, to, mark);
      dispatch(tr.scrollIntoView());
    }
    return true;
  }
}
