import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {Attrs, MarkType, NodeType} from 'prosemirror-model';
import {Command, EditorState} from 'prosemirror-state';

/**
 * Possible statuses of the menu item
 */
export enum MenuItemStatus {
  ENABLED = 'ENABLED',
  DISABLED = 'DISABLED',
  ACTIVE = 'ACTIVE',
}

@Component({
  selector: 'app-menu-item',
  templateUrl: './menu-item.component.html',
  styleUrls: ['./menu-item.component.scss'],
})
export class MenuItemComponent<T extends NodeType | MarkType = NodeType | MarkType> implements OnInit {

  @Input({ required: true }) icon!: string;
  @Input() tooltip?: string;

  @Input({ required: true }) state!: EditorState;
  @Input({ required: true }) type!: T;
  @Input() attrs: Attrs = {}; // Empty object to compare to schema nodes & marks because they have empty object if no Attrs
  @Output() execute = new EventEmitter<Command>();
  @Output() focusView = new EventEmitter<void>();

  command: Command = (): boolean => false;
  currentStatus = MenuItemStatus.ENABLED;

  protected filePath = '';
  protected readonly MenuItemStatus = MenuItemStatus;

  constructor() { }

  public ngOnInit() {
    this.filePath = `./assets/${this.icon}.svg`
    this.initCommand();
  }

  // Updated by parent editor menu component
  set status(newStatus: MenuItemStatus) {
    this.currentStatus = newStatus;
  }

  get status(): MenuItemStatus {
    return this.currentStatus;
  }

  // Override this method in child menu-item to represent its functionality
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
