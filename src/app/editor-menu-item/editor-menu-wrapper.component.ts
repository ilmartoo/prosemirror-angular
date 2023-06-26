import {Component} from '@angular/core';
import {EditorMenuItemComponent} from './editor-menu-item.component';
import {NodeType} from 'prosemirror-model';
import {wrapIn} from 'prosemirror-commands';

@Component({
  selector: 'app-editor-menu-wrapper',
  templateUrl: './editor-menu-item.component.html',
  styleUrls: ['./editor-menu-item.component.scss'],
  providers: [{ provide: EditorMenuItemComponent, useExisting: EditorMenuWrapperComponent }],
})
export class EditorMenuWrapperComponent extends EditorMenuItemComponent<NodeType> {

  protected override initCommand(): void {
    this.command = wrapIn(this.type, this.attrs);
  }
}