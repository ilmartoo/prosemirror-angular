import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

import {AppComponent} from './app.component';
import {TextEditorComponent} from './wysiwyg/text-editor/text-editor.component';
import {MenuComponent} from './wysiwyg/menu/menu.component';
import {MenuMarkItemComponent} from './wysiwyg/menu-item/menu-mark-item.component';
import {MenuNodeItemComponent} from './wysiwyg/menu-item/menu-node-item.component';
import {MenuItemComponent} from './wysiwyg/menu-item/menu-item.component';
import {MenuSchemaItemComponent} from './wysiwyg/menu-item/menu-schema-item.component';
import {MenuRemoveElementItemComponent} from './wysiwyg/menu-item/menu-remove-element-item.component';
import {MenuCreateTableItemComponent} from './wysiwyg/menu-item/menu-create-table-item.component';
import {MenuDeleteTableElementItemComponent} from './wysiwyg/menu-item/menu-delete-table-element-item.component';
import {MenuCreateTableElementItemComponent} from './wysiwyg/menu-item/menu-create-table-element-item.component';
import {MenuToggleTableHeaderComponent} from './wysiwyg/menu-item/menu-toggle-table-header-item.component';
import {MenuItemGenericComponent} from './wysiwyg/menu-item/menu-item-generic.component';
import {NgOptimizedImage} from '@angular/common';
import {MenuItemActionPopupComponent} from './wysiwyg/menu-item/popups/menu-item-action-popup.component';
import {MenuItemBasePopupComponent} from './wysiwyg/menu-item/popups/menu-item-base-popup.component';
import {MenuItemPopupLinkComponent} from './wysiwyg/menu-item/popups/menu-item-popup-link.component';
import {MenuItemPopupImageComponent} from './wysiwyg/menu-item/popups/menu-item-popup-image.component';

@NgModule({
  declarations: [
    AppComponent,
    TextEditorComponent,
    MenuComponent,
    MenuItemComponent,
    MenuItemGenericComponent,
    MenuItemBasePopupComponent,
    MenuItemActionPopupComponent,
    MenuSchemaItemComponent,
    MenuMarkItemComponent,
    MenuItemPopupLinkComponent,
    MenuItemPopupImageComponent,
    MenuRemoveElementItemComponent,
    MenuNodeItemComponent,
    MenuCreateTableItemComponent,
    MenuCreateTableElementItemComponent,
    MenuDeleteTableElementItemComponent,
    MenuToggleTableHeaderComponent,
  ],
  imports: [
    BrowserModule,
    NgOptimizedImage,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
