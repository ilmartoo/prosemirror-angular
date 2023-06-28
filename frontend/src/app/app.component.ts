import {Component} from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'Prosemirror Demo';

  initialData =
    '<p>Normal</p>' +
    '<p><strong>Bold</strong></p>' +
    '<p><em>Italic</em></p>' +
    '<p><u>Underline</u></p>' +
    '<p><s>Strikethrough</s></p>' +
    '<p><code>Inline code</code></p>' +
    '<p><a href="example.com">Link</a></p>' +
    '<h1>Header 1</h1>' +
    '<h2>Header 2</h2>' +
    '<h3>Header 3</h3>' +
    '<p>Paragraph</p>' +
    '<ol><li>Ordered list</li></ol>' +
    '<ul><li>Unordered list</li></ul>' +
    '<pre><code>Code block</code></pre>' +
    '<blockquote>Quote</blockquote>' +
    '<p><img alt="Example image" src="https://picsum.photos/seed/picsum/200/300"></p>' +
  '';
}

