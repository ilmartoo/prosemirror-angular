import {Component} from '@angular/core';
import {EditorMenuItemComponent} from './editor-menu-item.component';
import {MarkType} from 'prosemirror-model';
import {toggleMark} from 'prosemirror-commands';

@Component({
  selector: 'app-editor-menu-mark',
  templateUrl: './editor-menu-item.component.html',
  styleUrls: ['./editor-menu-item.component.scss'],
  providers: [{ provide: EditorMenuItemComponent, useExisting: EditorMenuMarkComponent }],
})
export class EditorMenuMarkComponent extends EditorMenuItemComponent<MarkType> {

  protected override initCommand(): void {
    this.command = toggleMark(this.type, this.attrs);
  }
}
