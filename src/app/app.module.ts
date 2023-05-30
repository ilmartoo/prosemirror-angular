import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import {EditorComponent} from '@tinymce/tinymce-angular';
import {CKEditorModule} from '@ckeditor/ckeditor5-angular';
import { RichTextEditorComponent } from './rich-text-editor/rich-text-editor.component';

@NgModule({
  declarations: [
    AppComponent,
    RichTextEditorComponent
  ],
	imports: [
		BrowserModule,
		EditorComponent,
		CKEditorModule
	],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
