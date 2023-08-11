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
import {SvgIconComponent} from './wysiwyg/icon/svg-icon.component';
import {HttpClientModule} from '@angular/common/http';
import {MenuItemPopupInputComponent} from './wysiwyg/menu-item/popup-inputs/menu-item-popup-input.component';
import {MenuItemPopupInputTextComponent} from './wysiwyg/menu-item/popup-inputs/menu-item-popup-input-text.component';
import {
  MenuItemPopupInputColorPaletteComponent
} from './wysiwyg/menu-item/popup-inputs/menu-item-popup-input-color-palette.component';
import {FormsModule} from '@angular/forms';
import {MenuItemPopupTextColorComponent} from './wysiwyg/menu-item/popups/menu-item-popup-text-color.component';
import {
  MenuItemPopupInputNumberComponent
} from './wysiwyg/menu-item/popup-inputs/menu-item-popup-input-number.component';
import {
  MenuItemPopupBackgroundColorComponent
} from './wysiwyg/menu-item/popups/menu-item-popup-background-color.component';

@NgModule({
  declarations: [
    AppComponent,
    TextEditorComponent,
    MenuComponent,
    SvgIconComponent,
    MenuItemSeparatorComponent,
    MenuItemBaseComponent,
    MenuItemForActionComponent,
    MenuItemPopupBaseComponent,
    MenuItemPopupForActionComponent,
    MenuItemPopupLinkComponent,
    MenuItemPopupImageComponent,
    MenuItemPopupTableComponent,
    MenuItemPopupTextColorComponent,
    MenuItemPopupBackgroundColorComponent,
    MenuItemPopupInputComponent,
    MenuItemPopupInputTextComponent,
    MenuItemPopupInputNumberComponent,
    MenuItemPopupInputColorPaletteComponent,
  ],
  imports: [
    BrowserModule,
    NgOptimizedImage,
    HttpClientModule,
    FormsModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
