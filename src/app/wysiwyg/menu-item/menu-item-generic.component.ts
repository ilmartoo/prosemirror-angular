import {
  AfterViewInit,
  Component,
  ComponentRef,
  createComponent, ElementRef,
  EnvironmentInjector,
  Input,
  ViewChild,
  ViewContainerRef
} from '@angular/core';
import {Command} from 'prosemirror-state';
import {EditorView} from 'prosemirror-view';

import {CursorActiveElements, MenuItemAction, MenuItemStatus} from './menu-item-types';
import {Attrs} from 'prosemirror-model';
import {MenuItemComponent} from './menu-item.component';
import {MenuItemActionPopupComponent} from './popups/menu-item-action-popup.component';
import {executeAfter} from '../utilities/multipurpose-helper';

@Component({
  selector: 'app-menu-item-generic',
  templateUrl: './menu-item-generic.component.html',
  styleUrls: ['./menu-item.component.scss'],
  providers: [{ provide: MenuItemComponent, useExisting: MenuItemGenericComponent }],
})
export class MenuItemGenericComponent implements AfterViewInit {

  @Input({ required: true }) action!: MenuItemAction;
  @Input({ required: false }) attrs: Attrs = { };
  @Input({ required: false }) icon?: string;
  @Input({ required: false }) text?: string;
  @Input({ required: false }) tooltip?: string;

  @ViewChild('itemBase') itemBaseRef!: ElementRef<HTMLDivElement>;
  @ViewChild('popupContainer', { read: ViewContainerRef }) popupContainer!: ViewContainerRef;

  protected view?: EditorView;
  protected readonly MenuItemStatus = MenuItemStatus;

  private cachedStatus: MenuItemStatus = MenuItemStatus.DISABLED;
  private popupRef?: ComponentRef<MenuItemActionPopupComponent>;

  /**
   * Gets the element's status
   */
  get status(): MenuItemStatus { return this.cachedStatus; }

  /**
   * Gets the element's command
   */
  get command(): Command {
    if (this.view) {
      const state = this.view.state;
      const attrs = this.attrs;
      return this.action.command({state, attrs});
    }
    return () => false; // Backup command for when update has not been called yet
  }

  constructor(protected environmentInjector: EnvironmentInjector) { }

  ngAfterViewInit() {
    executeAfter(() => {
      // Generates Popup element if needed
      if (this.action.popup) {

        this.popupRef = createComponent(
          this.action.popup,
          { environmentInjector: this.environmentInjector }
        );
        this.popupContainer.insert(this.popupRef.hostView);

        // Update attrs
        this.popup?.acceptedPopup.subscribe(attrs => {
          this.attrs = {
            ...this.attrs,
            attrs,
          };
          this.executeCommand();
        });
      }
    });
  }

  /**
   * Updates the overall state of the menu item
   * @param view Editor view
   * @param elements Active elements at cursor at editor view state
   */
  public update(view: EditorView, elements: CursorActiveElements) {
    this.view = view; // Update to the current view

    const state = view.state;
    const attrs = this.attrs;
    this.cachedStatus = this.action.status({state, elements, attrs});
  }

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
  protected executeCommand() {
    if (this.view) {
      this.command(this.view.state, this.view.dispatch, this.view);
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
