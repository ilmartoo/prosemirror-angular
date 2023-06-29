import {Component} from '@angular/core';
import {MenuItemComponent} from './menu-item.component';
import {setBlockType} from 'prosemirror-commands';
import {NodeType} from 'prosemirror-model';

@Component({
  selector: 'app-menu-textblock',
  templateUrl: './menu-item.component.html',
  styleUrls: ['./menu-item.component.scss'],
  providers: [{ provide: MenuItemComponent, useExisting: MenuTextblockComponent }],
})
export class MenuTextblockComponent extends MenuItemComponent<NodeType> {

  protected override initCommand(): void {
    this.command = setBlockType(this.type, this.attrs);
  }
}
