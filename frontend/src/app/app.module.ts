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

@NgModule({
  declarations: [
    AppComponent,
    TextEditorComponent,
    MenuComponent,
    MenuItemComponent,
    MenuSchemaItemComponent,
    MenuMarkItemComponent,
    MenuLinkItemComponent,
    MenuNodeItemComponent,
    MenuListItemComponent,
    MenuIndentItemComponent,
    MenuImageItemComponent,
  ],
	imports: [
		BrowserModule,
	],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
