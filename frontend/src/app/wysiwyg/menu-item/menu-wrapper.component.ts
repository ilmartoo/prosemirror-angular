import {Component} from '@angular/core';
import {MenuItemComponent} from './menu-item.component';
import {wrapIn} from 'prosemirror-commands';
import {NodeType} from 'prosemirror-model';

@Component({
  selector: 'app-menu-wrapper',
  templateUrl: './menu-item.component.html',
  styleUrls: ['./menu-item.component.scss'],
  providers: [{ provide: MenuItemComponent, useExisting: MenuWrapperComponent }],
})
export class MenuWrapperComponent extends MenuItemComponent<NodeType> {

  protected override initCommand(): void {
    this.command = wrapIn(this.type, this.attrs);
  }
}
