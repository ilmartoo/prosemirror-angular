import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {Attrs, MarkType, NodeType} from 'prosemirror-model';
import {Command, EditorState} from 'prosemirror-state';

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
export class EditorMenuItemComponent<T extends NodeType | MarkType = NodeType | MarkType> implements OnInit {

  @Input({ required: true }) icon!: string;
  @Input() tooltip?: string;

  @Input({ required: true }) state!: EditorState;
  @Input({ required: true }) type!: T;
  @Input() attrs: Attrs = {}; // Empty object to compare to schema nodes & marks because they have empty object if no Attrs
  @Output() execute = new EventEmitter<Command>();
  @Output() focusView = new EventEmitter<void>();

  command: Command = (): boolean => false;
  currentStatus = EditorMenuItemStatus.ENABLED;

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

  get status(): EditorMenuItemStatus {
    return this.currentStatus;
  }

  // Override this method in child editor-menu-item to represent its functionality
  protected initCommand(): void { };

  // Sends a signal to parent to execute given command or saved command
  protected executeCommand(command?: Command): void {
    this.execute.emit(command ?? this.command);
  }

  // Sends a signal to parent to focus the editor view
  protected focusEditor(): void {
    this.focusView.emit();
  }

  // Prevents losing editor focus when clicking on an editor item
  protected preventLosingEditorFocus(event: MouseEvent): void {
    event.preventDefault();
    this.focusEditor();
  }
}
