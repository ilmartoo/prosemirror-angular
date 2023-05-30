import {EditorView} from 'prosemirror-view';
import {Command, Plugin} from 'prosemirror-state';
import {setBlockType, toggleMark, wrapIn} from 'prosemirror-commands';
import {schema} from 'prosemirror-schema-basic';

/**
 * Menu item to display a button element on the menu bar
 */
export class MenuItem {
  element: HTMLButtonElement;
  command: Command;

  constructor(title: string, name: string, tooltip: string, command: Command) {
    this.command = command;

    this.element = document.createElement('button');
    this.element.type = 'button';
    this.element.classList.add('menu-item', name);

    const titleElement = document.createElement('span');
    titleElement.classList.add('menu-item-title');
    titleElement.append(title);

    const tooltipElement = document.createElement('span');
    tooltipElement.classList.add('menu-item-tooltip');
    tooltipElement.append(tooltip);

    this.element.append(titleElement, tooltipElement);

  }

  static createHeader(level: number): MenuItem {
    return new MenuItem(
      `H${level}`,
      'header',
      `Header ${level}`,
      setBlockType(schema.nodes.heading, {level: level})
    );
  }
}

/**
 * Menu bar to display a list of menu items which affect the rich text editor
 */
export class MenuBar {
  element: HTMLDivElement;
  items: MenuItem[];
  view: EditorView;

  constructor(view: EditorView, items: MenuItem[]) {
    this.view = view;
    this.items = items;

    this.element = document.createElement("div");
    this.element.classList.add("menu-bar");

    this.items.forEach(item => this.element.appendChild(item.element));
    this.update();

    this.element.addEventListener("mousedown", (event: MouseEvent) => {
      event.preventDefault();

      view.focus();

      console.log('Element to locate: ', event.target);
      const item = items.find(item => item.element.contains(event.target as HTMLElement));
      console.log('item located: ', item);
      item?.command(view.state, view.dispatch, view);
    });
  }

  update() {
    for (const item of this.items) {
      const active = item.command(this.view.state, undefined, this.view);
      active ? item.element.classList.add('active') : item.element.classList.remove('active') ;
    }
  }

  destroy() {
    this.element.remove();
  }
}

/**
 * Function to create a plugin for Prosemirror implementing a menu bar using MenuBar & MenuItem classes
 */
export function menuBar(): Plugin {
  return new Plugin({
    view(editorView) {
      const menuView = new MenuBar(editorView,[
        new MenuItem('T', 'regular', 'Normal text', setBlockType(schema.nodes.paragraph)),
        new MenuItem('B', 'bold', 'Bold text', toggleMark(schema.marks.strong)),
        new MenuItem('I', 'italic', 'Italic text', toggleMark(schema.marks.em)),
        new MenuItem('🔗', 'link', 'Link', toggleMark(schema.marks.link)),
        new MenuItem('</>', 'code-inline', 'Inline code', toggleMark(schema.marks.code)),
        new MenuItem('<>', 'code-block', 'Code block', wrapIn(schema.nodes.code_block)),
        new MenuItem('>', 'quote', 'Quote', wrapIn(schema.nodes.blockquote)),
        MenuItem.createHeader(1),
        MenuItem.createHeader(2),
        MenuItem.createHeader(3),
        MenuItem.createHeader(4),
      ]);

      editorView.dom.parentNode?.insertBefore(menuView.element, editorView.dom);
      return menuView;
    }
  })
}
