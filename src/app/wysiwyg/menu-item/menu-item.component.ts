import {Component, Input, OnInit} from '@angular/core';
import {Command} from 'prosemirror-state';
import {EditorView} from 'prosemirror-view';
import {EditorSelectionActiveElements} from '../menu/menu.component';

/**
 * Possible statuses of the menu item
 */
export enum MenuItemStatus {
  ENABLED = 'ENABLED',
  DISABLED = 'DISABLED',
  ACTIVE = 'ACTIVE',
}

const createIconPath = (iconName: string): string => `./assets/${iconName}.svg`;

@Component({
  selector: 'app-menu-item',
  templateUrl: './menu-item.component.html',
  styleUrls: ['./menu-item.component.scss'],
})
export class MenuItemComponent implements OnInit {

  @Input({ required: true }) icon!: string;
  @Input() tooltip?: string;
  @Input() command: Command = (): boolean => false;

  protected view?: EditorView;
  protected status = MenuItemStatus.ENABLED;
  protected filePath = '';
  protected readonly MenuItemStatus = MenuItemStatus;

  constructor() { }

  public ngOnInit() {
    this.filePath = createIconPath(this.icon);
    this.initCommand();
  }


  public update(view: EditorView, activeElements: EditorSelectionActiveElements): void {
    this.view = view; // Update to the current view
    this.status = this.calculateStatus(view, activeElements);
    this.updateData(view, activeElements);
  }

  /**
   * Override when needed to calculate the status based on the new view & active elements
   * @param view Current editor view
   * @param activeElements Active marks & nodes of the selection
   * @protected
   */
  protected calculateStatus(view: EditorView, activeElements: EditorSelectionActiveElements): MenuItemStatus {
    return MenuItemStatus.ENABLED;
  }

  /**
   * Override when needed to update other data based on the new view & active elements
   * @param view Current editor view
   * @param activeElements Active marks & nodes of the selection
   * @protected
   */
  protected updateData(view: EditorView, activeElements: EditorSelectionActiveElements): void { }

  /**
   * Initialize this item's command if not passed on input (Override this method if needed when extending this or a child class)
   * @protected
   */
  protected initCommand(): void { };

  /**
   * Executes this given command or saved command if no command is specified
   * @param command Command to execute
   * @protected
   */
  protected executeCommand(command?: Command): void {
    if (this.view) {
      const commandToExecute = command ?? this.command;
      commandToExecute(this.view.state, this.view.dispatch, this.view);
    }
  }

  /**
   * Focus the editor view
   * @protected
   */
  protected focusEditor(): void {
    this.view?.focus();
  }

  /**
   * Prevents losing editor focus when clicking on an editor item
   * @protected
   */
  protected preventLosingEditorFocus(event: MouseEvent): void {
    event.preventDefault();
    this.focusEditor();
  }
}
