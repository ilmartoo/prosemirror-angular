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

    '<indent><indent><p>Paragraph</p></indent></indent>' +

    '<table>' +
    '  <tr>' +
    '    <th scope="col">Band</th>' +
    '    <th scope="col">Year formed</th>' +
    '    <th scope="col">No. of Albums</th>' +
    '    <th scope="col">Most famous song</th>' +
    '  </tr>' +
    '  <tr>' +
    '    <th scope="row">Buzzcocks</th>' +
    '    <td>1976</td>' +
    '    <td>9</td>' +
    '    <td>Ever fallen in love (with someone you shouldn\'t\'ve)</td>' +
    '  </tr>' +
    '  <tr>' +
    '    <th scope="row">The Clash</th>' +
    '    <td>1976</td>' +
    '    <td>6</td>' +
    '    <td>London Calling</td>' +
    '  </tr>' +
    '  <tr>' +
    '    <th scope="row">The Stranglers</th>' +
    '    <td>1974</td>' +
    '    <td>17</td>' +
    '    <td>No More Heroes</td>' +
    '  </tr>' +
    '</table>' +

    '<ol>' +
    '  <li>Ordered list</li>' +
    '  <ol>' +
    '    <li>Ordered sublist</li>' +
    '  </ol>' +
    '</ol>' +
    '<ul>' +
    '  <li>Unordered list</li>' +
    '  <ul>' +
    '    <li>Unordered sublist</li>' +
    '  </ul>' +
    '</ul>' +

    '<pre><code>Code block</code></pre>' +
    '<blockquote>Quote</blockquote>' +

    '<img alt="Example image" title="Example image" src="https://picsum.photos/seed/picsum/600/400">' +
    '<img alt="Example image" title="Example image" src="https://picsum.photos/seed/picsum/200/300">' +
    '';
}

