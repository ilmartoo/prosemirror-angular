import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

import {AppComponent} from './app.component';
import {TextEditorComponent} from './wysiwyg/text-editor/text-editor.component';
import {MenuComponent} from './wysiwyg/menu/menu.component';
import {MenuMarkComponent} from './wysiwyg/menu-item/menu-mark.component';
import {MenuListComponent} from './wysiwyg/menu-item/menu-list.component';
import {MenuTextblockComponent} from './wysiwyg/menu-item/menu-textblock.component';
import {MenuItemComponent} from './wysiwyg/menu-item/menu-item.component';
import {MenuLinkComponent} from './wysiwyg/menu-item/menu-link.component';
import {MenuImageComponent} from './wysiwyg/menu-item/menu-image.component';

@NgModule({
  declarations: [
    AppComponent,
    TextEditorComponent,
    MenuComponent,
    MenuItemComponent,
    MenuMarkComponent,
    MenuLinkComponent,
    MenuTextblockComponent,
    MenuListComponent,
    MenuImageComponent,
  ],
	imports: [
		BrowserModule,
	],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
