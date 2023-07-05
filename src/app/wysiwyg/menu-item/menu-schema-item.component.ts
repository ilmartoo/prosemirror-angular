import {Component, Input} from '@angular/core';
import {Attrs, MarkType, NodeType} from 'prosemirror-model';
import {MenuItemComponent} from './menu-item.component';

@Component({
  selector: '',
  template: '',
  providers: [{ provide: MenuItemComponent, useExisting: MenuSchemaItemComponent }],
})
export class MenuSchemaItemComponent<T extends NodeType | MarkType = NodeType | MarkType> extends MenuItemComponent {

  @Input({ required: true }) type!: T;
  @Input() attrs: Attrs = {}; // Empty object to compare to schema nodes & marks because they have empty object if no Attrs
}
