import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

import {AppComponent} from './app.component';
import {TextEditorComponent} from './wysiwyg/text-editor/text-editor.component';
import {MenuComponent} from './wysiwyg/menu/menu.component';
import {MenuItemBaseComponent} from './wysiwyg/menu-item/menu-item-base.component';
import {MenuItemForActionComponent} from './wysiwyg/menu-item/menu-item-for-action.component';
import {NgOptimizedImage} from '@angular/common';
import {MenuItemPopupForActionComponent} from './wysiwyg/menu-item/popups/menu-item-popup-for-action.component';
import {MenuItemPopupBaseComponent} from './wysiwyg/menu-item/popups/menu-item-popup-base.component';
import {MenuItemPopupLinkComponent} from './wysiwyg/menu-item/popups/menu-item-popup-link.component';
import {MenuItemPopupImageComponent} from './wysiwyg/menu-item/popups/menu-item-popup-image.component';
import {MenuItemPopupTableComponent} from './wysiwyg/menu-item/popups/menu-item-popup-table.component';
import {MenuItemSeparatorComponent} from './wysiwyg/menu-item/menu-item-separator.component';

@NgModule({
  declarations: [
    AppComponent,
    TextEditorComponent,
    MenuComponent,
    MenuItemSeparatorComponent,
    MenuItemBaseComponent,
    MenuItemForActionComponent,
    MenuItemPopupBaseComponent,
    MenuItemPopupForActionComponent,
    MenuItemPopupLinkComponent,
    MenuItemPopupImageComponent,
    MenuItemPopupTableComponent,
  ],
  imports: [
    BrowserModule,
    NgOptimizedImage,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
