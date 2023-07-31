import {EditorView} from 'prosemirror-view';
import {CursorActiveElements} from './menu-item-types';

export abstract class MenuItem {
  abstract update(view: EditorView, cursorActiveElements: CursorActiveElements): void;
}
