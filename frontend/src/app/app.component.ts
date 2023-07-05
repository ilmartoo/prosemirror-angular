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
    '<p><a href="https://example.com" title="Link">Link</a></p>' +
    '<h1>Header 1</h1>' +
    '<h2>Header 2</h2>' +
    '<h3>Header 3</h3>' +
    '<div class="indent"><div class="indent"><p>Paragraph</p></div></div>' +
    '<ol>' +
      '<li>Ordered list</li>' +
      '<ol>' +
        '<li>Ordered sublist</li>' +
      '</ol>' +
    '</ol>' +
    '<ul>' +
      '<li>Unordered list</li>' +
      '<ul>' +
        '<li>Unordered sublist</li>' +
      '</ul>' +
    '</ul>' +
    '<pre><code>Code block</code></pre>' +
    '<blockquote>Quote</blockquote>' +
    '<p><img alt="Example image" title="Example image" src="https://picsum.photos/seed/picsum/200/300"></p>' +
  '';
}
