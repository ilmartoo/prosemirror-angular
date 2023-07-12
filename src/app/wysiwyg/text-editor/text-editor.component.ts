import {AfterViewInit, Component, ElementRef, Input, ViewChild, ViewEncapsulation} from '@angular/core';
import {DOMParser as ProseDOMParser} from 'prosemirror-model';
import {EditorState} from 'prosemirror-state';
import {history, redo, undo} from 'prosemirror-history';
import {keymap} from 'prosemirror-keymap';
import {baseKeymap} from 'prosemirror-commands';
import {EditorView} from 'prosemirror-view';
import {MenuComponent} from '../menu/menu.component';
import {customSchema} from './custom-schema';
import {decreaseIndent, increaseIndent, newBlock, newLine} from '../utilities/commands';
import {currentElementDecorator, selectedNodesDecorator} from "../utilities/decorators";
import {tableEditing} from 'prosemirror-tables';
import {executeAfter} from '../utilities/multipurpose-helper';


/**
 * Datos a tener en cuenta:
 *
 * - El estilado de los elementos introducidos dinamicamente (Menu y otros elementos introducidos por los plugins)
 *   necesita ser estilado globalmente debido a la encapsulación realizada por Angular
 *
 * - Componente realizado según el ejemplo de https://prosemirror.net/examples/menu/
 *
 * - Revisar el código de https://github.com/prosemirror/prosemirror-menu para hacer que funcionen los botones d
 *   bloque (headers, blockquote, paragraph...)
 *
 * - Repo de introducción a ProseMirror que intenta mejorar la docu oficial: https://github.com/PierBover/prosemirror-cookbook
 */
@Component({
  selector: 'app-text-editor',
  templateUrl: './text-editor.component.html',
  styleUrls: ['./text-editor.component.scss'],
  encapsulation: ViewEncapsulation.None // Needed in order to apply styles to ProseMirror dynamically added editor element
})
export class TextEditorComponent implements AfterViewInit {
  @Input() initialData?: string;

  @ViewChild('prosemirror') prosemirrorRef!: ElementRef<HTMLDivElement>;
  @ViewChild('menu') menuRef!: MenuComponent;

  protected view!: EditorView;

  constructor() { }

  ngAfterViewInit(): void {
    this.createEditor();
  }

  private initialDataNode(): HTMLElement {
    const parser = new DOMParser();
    return parser.parseFromString(
      `<div>${this.initialData ?? ''}</div>`,
      'text/html'
    ).body.firstChild as HTMLElement;
  }

  /**
   * Crea el editor de ProseMirror
   */
  private createEditor(): void {
    // Initial state of the editor.
    const initialState = EditorState.create({
      // Schema: declares how nodes & marks will be parsed
      schema: customSchema,
      // Initial data (formatted text) of the state
      doc: ProseDOMParser.fromSchema(customSchema).parse(this.initialDataNode()),
      // Plugins that add functionality to the editor - Can be edited in future states
      plugins: [
        history(), // Command history
        keymap({
          ...baseKeymap, // Base keymap for the editor
          'Enter': newBlock,
          'Mod-Enter': newLine,
          'Shift-Enter': newLine,
          'Mod-z': undo,
          'Mod-y': redo,
          'Mod-Shift-z': redo,
          'Tab': increaseIndent,
          'Shift-Tab': decreaseIndent,
        }),
        this.menuRef.asPlugin(),   // Menu bar
        currentElementDecorator(), // Decorator marking the current element
        selectedNodesDecorator(),  // Decorator marking the selected nodes
        tableEditing(),            // Table management
      ],
    })

    executeAfter(() => {
      // View - Referencia al elemento introducido en el DOM
      this.view = new EditorView(this.prosemirrorRef.nativeElement, {
        state: initialState,
      });
    });
  }
}
