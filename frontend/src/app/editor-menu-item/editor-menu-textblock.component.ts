import {Component} from '@angular/core';
import {EditorMenuItemComponent} from './editor-menu-item.component';
import {setBlockType} from 'prosemirror-commands';
import {NodeType} from 'prosemirror-model';

@Component({
  selector: 'app-editor-menu-textblock',
  templateUrl: './editor-menu-item.component.html',
  styleUrls: ['./editor-menu-item.component.scss'],
  providers: [{ provide: EditorMenuItemComponent, useExisting: EditorMenuTextblockComponent }],
})
export class EditorMenuTextblockComponent extends EditorMenuItemComponent<NodeType> {

  protected override initCommand(): void {
    this.command = setBlockType(this.type, this.attrs);
  }
}
