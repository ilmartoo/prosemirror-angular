import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  QueryList,
  ViewChildren
} from '@angular/core';
import {EditorState} from 'prosemirror-state';
import {MarkType, NodeType} from 'prosemirror-model';

@Component({
  selector: 'app-menu-item-action-popup',
  template: '',
})
export class MenuItemPopupForActionComponent<T extends MarkType | NodeType = MarkType | NodeType> implements AfterViewInit {
  @Input() type!: T;
  @Output() acceptedPopup = new EventEmitter<{ [input: string]: string }>();
  @Output() focusEditor = new EventEmitter<void>();

  @ViewChildren('input') inputsRef!: QueryList<ElementRef<HTMLInputElement>>;

  protected isPopupOpen = false;
  protected isValid = false;
  protected inputs: { [input: string]: HTMLInputElement } = { };

  ngAfterViewInit() {
    this.inputsRef.forEach(item => this.inputs[item.nativeElement.name] = item.nativeElement);
  }

  /**
   * Toggles between open & closed popup
   * @param state Editor state
   */
  togglePopup(state: EditorState) {
    if (this.isPopupOpen) {
      this.close();
    } else {
      this.open(state);
    }
  }

  /**
   * Resets & opens the popup
   * @param state Editor state
   */
  open(state: EditorState) {
    this.reset(state);
    this.validate();
    this.isPopupOpen = true;
  }

  /**
   * Closes the popup
   */
  close() {
    this.isPopupOpen = false;
    this.focusEditor.emit();
  }

  /** Checks if the popup is opened */
  get isOpened(): boolean {
    return this.isPopupOpen;
  }

  /**
   * Dictionary of values for every input for any given time
   * @protected
   * @returns Dictionary of current values for every input
   */
  protected get values(): { [p: string]: string } {
    const values: { [p: string]: string } = { };
    this.inputsRef.forEach(item => values[item.nativeElement.name] = item.nativeElement.value);
    return values;
  }

  /**
   * Updates the value of an input with a given trimmed value
   * @param name Name of the input to update
   * @param value New value for the input
   * @protected
   */
  protected setValue(name: string, value: string) {
    this.inputs[name].value = value.trim();
  }

  /**
   * Resets the state of the inputs on popup opening. Is advised to override this method on extension.
   * @param state Editor state
   * @protected
   */
  protected reset(state: EditorState) { }

  /**
   * Checks if the input is valid & updates isValid value accordingly. Is advised to override this method on extension.
   * @protected
   * @returns Returns the new value of isValid to reduce `if` checks:
   * ```
   * // DO THIS
   * if (this.validate()) {
   *   // ...
   * }
   * // INSTEAD OF THIS
   * this.validate();
   * if (this.isValid) {
   *   // ...
   * }
   * ```
   */
  protected validate(): boolean {
    return (this.isValid = true);
  }

  /**
   * Transforms the input values for their output.
   * May or may not return an array of the same length.
   * Is advised to override this method on extension.
   * @param inputs Array of inputs as { name: inputName, value: inputValue }
   * @protected
   * @returns List of transformed values
   */
  protected transformValuesForOutput(inputs: { [input: string]: string }): { [attr: string]: any } {
    return inputs;
  }

  /**
   * Accepts the popup
   * @internal
   */
  protected acceptPopup() {
    if (this.validate()) {
      const inputs = this.transformValuesForOutput(this.values);
      this.acceptedPopup.emit(inputs);

      this.close();
    }
  }

  /**
   * Generates the label for the accept button. Is advised to override this method on extension.
   * @protected
   * @returns Label for the acceptance button
   */
  protected acceptPopupLabel(): string {
    return 'Valid';
  };
}
