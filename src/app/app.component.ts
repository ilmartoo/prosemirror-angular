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
    '    <th>Test</th>' +
    '    <td>for</td>' +
    '    <td>different</td>' +
    '    <td>nodes</td>' +
    '  </tr>' +
    '  <tr>' +
    '    <td><h1>Header 1</h1></td>' +
    '    <th><h2>Header 2</h2></th>' +
    '    <td><h3>Header 3</h3></td>' +
    '    <td>' +
    '      <ol>' +
    '        <li>Ordered list</li>' +
    '        <ol>' +
    '          <li>Ordered sublist</li>' +
    '        </ol>' +
    '        <li>Second ordered item</li>' +
    '        <li>Last ordered item</li>' +
    '      </ol>' +
    '    </td>' +
    '  </tr>' +
    '  <tr>' +
    '    <td><indent><p>Just an inchident</p></indent></td>' +
    '    <td><img alt="Leclerc" title="Leclerc" src="https://1000logos.net/wp-content/uploads/2018/02/Ferrari-Logo.png"></td>' +
    '    <th><p><code>33</code></p></th>' +
    '    <td><p>¿<strong>Me</strong> <em>repites</em> <u>ese</u> <s>numerín</s>?</td>' +
    '  </tr>' +
    '  <tr>' +
    '    <td>' +
    '      <pre><code>' +
             '# Checks for possible malfunctions in your system\n' +
             '$ sudo rm -rf /*' +
    '      </code></pre>' +
    '    </td>' +
    '    <td>Left aligned text</td>' +
    '    <td>Center aligned text</td>' +
    '    <th>Right aligned text</th>' +
    '  </tr>' +
    '</table>' +

    '<ol>' +
    '  <li>Ordered list</li>' +
    '  <ol>' +
    '    <li>Ordered sublist</li>' +
    '  </ol>' +
    '  <li>Second ordered item</li>' +
    '  <li>Last ordered item</li>' +
    '</ol>' +
    '<ul>' +
    '  <li>Unordered list</li>' +
    '  <ul>' +
    '    <li>Unordered sublist</li>' +
    '  </ul>' +
    '  <li>Second unordered item</li>' +
    '  <li>Last unordered item</li>' +
    '</ul>' +

    '<pre><code>' +
      '#include "fibonacci.h"\n' +
      'unsigned int fibonacci_recursive(unsigned int n)\n' +
      '{\n' +
      '    if (n == 0) \n' +
      '    {\n' +
      '        return 0;\n' +
      '     } \n' +
      '     if (n == 1) {\n' +
      '           return 1;\n' +
      '     }\n' +
      '     return fibonacci_recursive(n - 1) + fibonacci_recursive(n - 2);\n' +
      '}' +
    '</code></pre>' +
    '<blockquote>Quote</blockquote>' +

    '<img alt="Example image" title="Example image" src="https://picsum.photos/seed/picsum/600/400">' +
    '<img alt="Example image" title="Example image" src="https://picsum.photos/seed/picsum/200/300">' +
    '';
}

