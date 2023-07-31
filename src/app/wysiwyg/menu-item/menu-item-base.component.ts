import {Component, Input, OnInit} from '@angular/core';
import {Command} from 'prosemirror-state';
import {EditorView} from 'prosemirror-view';
import {CursorActiveElements, MenuItemStatus} from './menu-item-types';
import {MenuItem} from './menu-item';

@Component({
  selector: 'app-menu-item-base',
  templateUrl: './menu-item-base.component.html',
  styleUrls: ['./menu-item-base.component.scss'],
  providers: [{ provide: MenuItem, useExisting: MenuItemBaseComponent }],
})
export class MenuItemBaseComponent extends MenuItem implements OnInit {

  @Input({ required: false }) icon?: string;
  @Input({ required: false }) text?: string;
  @Input({ required: false }) tooltip?: string;
  @Input() command!: Command;

  protected isCommandFromInput = false;

  protected view?: EditorView;
  protected status = MenuItemStatus.ENABLED;
  protected readonly MenuItemStatus = MenuItemStatus;

  constructor() {
    super();
  }

  public ngOnInit() {
    this.isCommandFromInput = !!this.command;
    if (!this.isCommandFromInput) {
      this.command = () => false; // Default command, to be updated
    }
  }

  protected iconPath(iconName: string): string {
    return `./assets/${iconName}.svg`;
  }


  override update(view: EditorView, activeElements: CursorActiveElements): void {
    this.view = view; // Update to the current view
    if (!this.isCommandFromInput) {
      this.command = this.updatedCommand(view);
    }
    this.status = this.calculateStatus(view, activeElements);
    this.updateData(view, activeElements);
  }

  /**
   * Override when needed to calculate the status based on the new view & active elements
   * @param view Current editor view
   * @param activeElements Active marks & nodes of the selection
   * @protected
   */
  protected calculateStatus(view: EditorView, activeElements: CursorActiveElements): MenuItemStatus {
    return MenuItemStatus.ENABLED;
  }

  /**
   * Override when needed to update other data based on the new view & active elements
   * @param view Current editor view
   * @param elements Active marks & nodes at cursor
   * @protected
   */
  protected updateData(view: EditorView, elements: CursorActiveElements): void { }

  /**
   * Returns the updated command (Override this method if needed when extending this or a child class).
   * The command will only be updated if no command is passed through input params.
   * @param view Updated editor view
   * @protected
   */
  protected updatedCommand(view: EditorView): Command {
    return (): boolean => false;
  };

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

  /**
   * Callback to execute when the item is clicked
   * @protected
   */
  protected onClick(): void {
    this.executeCommand();
  }
}
