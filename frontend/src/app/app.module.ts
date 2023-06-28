import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

import {AppComponent} from './app.component';
import {RichTextEditorComponent} from './rich-text-editor/rich-text-editor.component';
import {EditorMenuComponent} from './editor-menu/editor-menu.component';
import {EditorMenuMarkComponent} from './editor-menu-item/editor-menu-mark.component';
import {EditorMenuWrapperComponent} from './editor-menu-item/editor-menu-wrapper.component';
import {EditorMenuTextblockComponent} from './editor-menu-item/editor-menu-textblock.component';
import {EditorMenuItemComponent} from './editor-menu-item/editor-menu-item.component';
import {EditorMenuLinkComponent} from './editor-menu-item/editor-menu-link.component';
import {EditorMenuImageComponent} from './editor-menu-item/editor-menu-image.component';

@NgModule({
  declarations: [
    AppComponent,
    RichTextEditorComponent,
    EditorMenuComponent,
    EditorMenuItemComponent,
    EditorMenuMarkComponent,
    EditorMenuLinkComponent,
    EditorMenuTextblockComponent,
    EditorMenuWrapperComponent,
    EditorMenuImageComponent,
  ],
	imports: [
		BrowserModule,
	],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
