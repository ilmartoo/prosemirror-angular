import {Component} from '@angular/core';
import {MenuItemComponent} from './menu-item.component';
import {toggleMark} from 'prosemirror-commands';
import {MarkType} from 'prosemirror-model';

@Component({
  selector: 'app-menu-mark',
  templateUrl: './menu-item.component.html',
  styleUrls: ['./menu-item.component.scss'],
  providers: [{ provide: MenuItemComponent, useExisting: MenuMarkComponent }],
})
export class MenuMarkComponent extends MenuItemComponent<MarkType> {

  protected override initCommand(): void {
    this.command = toggleMark(this.type, this.attrs);
  }
}
