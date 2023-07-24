import {
  AfterViewInit,
  Component,
  ComponentRef,
  createComponent,
  ElementRef,
  EnvironmentInjector,
  Input,
  OnDestroy,
  ViewChild,
  ViewContainerRef
} from '@angular/core';
import {Command} from 'prosemirror-state';
import {EditorView} from 'prosemirror-view';

import {CursorActiveElements, MenuItemBasicAction, MenuItemStatus, MenuItemTypeAction} from './menu-item-types';
import {MenuItemComponent} from './menu-item.component';
import {MenuItemActionPopupComponent} from './popups/menu-item-action-popup.component';
import {executeAfter} from '../utilities/multipurpose-helper';
import {Attrs} from 'prosemirror-model';

@Component({
  selector: 'app-menu-item-generic',
  templateUrl: './menu-item-generic.component.html',
  styleUrls: ['./menu-item.component.scss'],
  providers: [{ provide: MenuItemComponent, useExisting: MenuItemGenericComponent }],
})
export class MenuItemGenericComponent implements AfterViewInit, OnDestroy {

  @Input({ required: true }) action!: MenuItemBasicAction | MenuItemTypeAction;
  @Input({ required: false }) icon?: string;
  @Input({ required: false }) text?: string;
  @Input({ required: false }) tooltip?: string;

  @ViewChild('itemBase') itemBaseRef!: ElementRef<HTMLDivElement>;
  @ViewChild('popupContainer', { read: ViewContainerRef }) popupContainer!: ViewContainerRef;

  protected view?: EditorView;
  protected cachedStatus: MenuItemStatus = MenuItemStatus.DISABLED;
  protected popupRef?: ComponentRef<MenuItemActionPopupComponent>;

  protected readonly MenuItemStatus = MenuItemStatus;

  /**
   * Gets the element's status
   */
  get status(): MenuItemStatus { return this.cachedStatus; }

  /**
   * Gets the element's command
   */
  command(attrs?: Attrs): Command {
    if (this.view) {
      const state = this.view.state;
      return this.action.command({state, attrs});
    }
    return () => false; // Backup command for when update has not been called yet
  }

  constructor(protected environmentInjector: EnvironmentInjector) { }

  ngAfterViewInit() {
    executeAfter(() => {
      // Generates Popup element if needed
      if (this.isTypeAction(this.action) && this.action.popup) {

        // Creates the popup component
        this.popupRef = createComponent(
          this.action.popup,
          { environmentInjector: this.environmentInjector }
        );

        // Initializes type
        this.popup!.type = this.action.type!;

        // Update attrs
        this.popup!.acceptedPopup.subscribe(attrs => this.executeCommand(attrs));

        // Focus on close
        this.popup!.focusEditor.subscribe(() => this.focusEditor());

        // Inserts the popup component into view
        this.popupContainer.insert(this.popupRef.hostView);
      }
    });
  }

  ngOnDestroy() {
    this.popupRef?.destroy();
  }

  /**
   * Updates the overall state of the menu item
   * @param view Editor view
   * @param elements Active elements at cursor at editor view state
   */
  public update(view: EditorView, elements: CursorActiveElements) {
    this.view = view; // Update to the current view

    const state = view.state;
    this.cachedStatus = this.action.status({state, elements});
  }

  /**
   * Checks if the action is a MenuItemTypeAction type
   * @param action Action to check
   * @protected
   * @returns True if action is a MenuItemTypeAction type
   */
  protected isTypeAction(action: MenuItemBasicAction | MenuItemTypeAction): action is MenuItemTypeAction {
    return 'type' in action;
  }

  /**
   * Retrieves the instance of the popup, if any
   * @protected
   * @returns Popup instance if it exists
   * */
  protected get popup(): MenuItemActionPopupComponent | undefined {
    return this.popupRef?.instance;
  }

  /**
   * Retrieves the SVG icon path
   * @param iconName Name of the SVG icon file without extension
   * @protected
   * @returns Path to the icon
   */
  protected iconPath(iconName: string): string {
    return `./assets/${iconName}.svg`;
  }

  /**
   * Executes the element's command
   * @protected
   */
  protected executeCommand(attrs?: Attrs) {
    if (this.view) {
      this.command(attrs)(this.view.state, this.view.dispatch, this.view);
    }
  }

  /**
   * Focus the editor view
   * @protected
   */
  protected focusEditor() {
    this.view?.focus();
  }

  /**
   * Checks if the popup has lost focus, if any
   * @param event Focus event
   * @protected
   */
  protected popupFocusLost(event: FocusEvent) {
    if (this.popup) {
      const newlyFocussedElement = event.relatedTarget as HTMLElement;
      if (!this.itemBaseRef.nativeElement.contains(newlyFocussedElement)) {
        this.popup.close();
      }
    }
  }

  /**
   * Prevents losing editor focus when clicking on an editor item
   * @protected
   */
  protected preventLosingEditorFocus(event: MouseEvent) {
    if (!this.popup) {
      event.preventDefault();
      this.focusEditor();
    }
  }
}
