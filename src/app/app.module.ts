import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

import {AppComponent} from './app.component';
import {TextEditorComponent} from './wysiwyg/text-editor/text-editor.component';
import {MenuComponent} from './wysiwyg/menu/menu.component';
import {MenuMarkItemComponent} from './wysiwyg/menu-item/menu-mark-item.component';
import {MenuListItemComponent} from './wysiwyg/menu-item/menu-list-item.component';
import {MenuNodeItemComponent} from './wysiwyg/menu-item/menu-node-item.component';
import {MenuItemComponent} from './wysiwyg/menu-item/menu-item.component';
import {MenuLinkItemComponent} from './wysiwyg/menu-item/menu-link-item.component';
import {MenuImageItemComponent} from './wysiwyg/menu-item/menu-image-item.component';
import {MenuSchemaItemComponent} from './wysiwyg/menu-item/menu-schema-item.component';
import {MenuIndentItemComponent} from './wysiwyg/menu-item/menu-indent-item.component';
import {MenuRemoveElementItemComponent} from './wysiwyg/menu-item/menu-remove-element-item.component';
import {MenuCreateTableItemComponent} from './wysiwyg/menu-item/menu-create-table-item.component';
import {MenuDeleteTableElementItemComponent} from './wysiwyg/menu-item/menu-delete-table-element-item.component';
import {MenuCreateTableElementItemComponent} from './wysiwyg/menu-item/menu-create-table-element-item.component';

@NgModule({
  declarations: [
    AppComponent,
    TextEditorComponent,
    MenuComponent,
    MenuItemComponent,
    MenuSchemaItemComponent,
    MenuMarkItemComponent,
    MenuLinkItemComponent,
    MenuRemoveElementItemComponent,
    MenuNodeItemComponent,
    MenuListItemComponent,
    MenuIndentItemComponent,
    MenuImageItemComponent,
    MenuCreateTableItemComponent,
    MenuCreateTableElementItemComponent,
    MenuDeleteTableElementItemComponent,
  ],
	imports: [
		BrowserModule,
	],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
