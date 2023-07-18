import {Component} from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'Prosemirror Demo';

  initialData =
    '<h1><strong>[ TEXT STYLING ]</strong></h1>' +
    '<p>' +
    'Normal<br>' +
    '<strong>Bold</strong><br>' +
    '<em>Italic</em><br>' +
    '<u>Underline</u><br>' +
    '<s>Strikethrough</s><br>' +
    '<code>Inline code</code><br>' +
    '<sup>Super</sup>script<br>' +
    '<sub>Sub</sub>script' +
    '</p>' +

    '<p></p>' +

    '<h1><strong>[ REFERENCES ]</strong></h1>' +
    '<a href="https://example.com" title="https://example.com">Link to example.com</a>' +
    '<img alt="Example image" title="Example image" src="https://picsum.photos/seed/picsum/600/400">' +

    '<p></p>' +

    '<h1><strong>[ HEADERS ]</strong></h1>' +
    '<h1>Header 1</h1>' +
    '<h2>Header 2</h2>' +
    '<h3>Header 3</h3>' +

    '<p></p>' +

    '<h1><strong>[ BLOCKS ]</strong></h1>' +
    '<blockquote>Blockquotes</blockquote>' +
    '<p></p>' +
    '<pre><code>' +
    '/** CODE BLOCK */\n' +
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
    '<p></p>' +
    '<ol>' +
    '  <li>Ordered list</li>' +
    '  <ol>' +
    '    <li>Ordered sublist</li>' +
    '  </ol>' +
    '  <li>Second ordered item</li>' +
    '  <li>Last ordered item</li>' +
    '</ol>' +
    '<p></p>' +
    '<ul>' +
    '  <li>Unordered list</li>' +
    '  <ul>' +
    '    <li>Unordered sublist</li>' +
    '  </ul>' +
    '  <li>Second unordered item</li>' +
    '  <li>Last unordered item</li>' +
    '</ul>' +
    '<p></p>' +
    '<indent>' +
    '  <p>Block identations</p>' +
    '  <indent><p><em>Anything can be idented</em></p></indent>' +
    '</indent>' +

    '<p></p>' +

    '<h1><strong>[ TABLES ]</strong></h1>' +
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
    '    <th><table><tr><td>13</td><td>21</td><td>34</td></tr><tr><td>8</td><td>1</td><td>1</td></tr><tr><td>5</td><td>3</td><td>2</td></tr></table></th>' +
    '    <td><sub><code>33</code> <sub>¿</sub><strong>Me</strong> <em>repites</em> <u>ese</u> <s>numerín</s><sup>?</sup></td>' +
    '  </tr>' +
    '  <tr>' +
    '    <td>' +
    '      <pre><code>' +
             '# Checks for possible malfunctions in your system\n' +
             '$ sudo rm -rf /*' +
    '      </code></pre>' +
    '    </td>' +
    '    <td>Left aligned text TODO</td>' +
    '    <td>Center aligned text TODO</td>' +
    '    <th>Right aligned text TODO</th>' +
    '  </tr>' +
    '</table>' +
    '';
}

