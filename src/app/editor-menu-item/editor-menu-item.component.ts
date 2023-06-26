import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {Attrs, MarkType, NodeType} from 'prosemirror-model';
import {Command} from 'prosemirror-state';
import {EditorView} from 'prosemirror-view';

/**
 * Possible statuses of the menu item
 */
export enum EditorMenuItemStatus {
  ENABLED = 'ENABLED',
  DISABLED = 'DISABLED',
  ACTIVE = 'ACTIVE',
}

@Component({
  selector: 'app-editor-menu-item',
  templateUrl: './editor-menu-item.component.html',
  styleUrls: ['./editor-menu-item.component.scss'],
})
export class EditorMenuItemComponent<T = MarkType | NodeType> implements OnInit {

  @Input({ required: true }) icon!: string;
  @Input() tooltip?: string;

  @Input({ required: true }) view!: EditorView;
  @Input({ required: true }) type!: T;
  @Input() attrs?: Attrs;
  @Output() execute = new EventEmitter<Command>();

  currentStatus = EditorMenuItemStatus.ENABLED;
  command: Command = (): boolean => { return false };

  protected filePath = '';

  protected readonly EditorMenuItemStatus = EditorMenuItemStatus;

  constructor() { }

  public ngOnInit() {
    this.filePath = `./assets/${this.icon}.svg`
    this.initCommand();
  }

  // Updated by parent editor menu component
  set status(newStatus: EditorMenuItemStatus) {
    this.currentStatus = newStatus;
  }

  // Override this method in child editor-menu-item to represent its functionality
  protected initCommand(): void { };

  // Sends a signal to parent to execute given command or saved command
  protected executeCommand(command?: Command): void {
    this.execute.emit(command ?? this.command);
  }

  // Prevents losing editor focus when clicking on an editor item
  protected preventLosingEditorFocus(event: MouseEvent): void {
    event.preventDefault();
    this.view.focus();
  }
}
