import {AfterViewInit, Directive, ElementRef, EventEmitter, Output, QueryList, ViewChildren} from '@angular/core';

@Directive({ selector: 'app-menu-item-action-popup' })
export class MenuItemActionPopupComponent implements AfterViewInit {

  @Output() acceptedPopup = new EventEmitter<{ [input: string]: string }>();

  @ViewChildren('input') inputsRef!: QueryList<ElementRef<HTMLInputElement>>;

  protected isPopupOpen = false;
  protected isValid = false;
  protected inputs: { [input: string]: HTMLInputElement } = { };

  ngAfterViewInit() {
    this.inputsRef.forEach(item => this.inputs[item.nativeElement.name] = item.nativeElement);
    this.reset();
  }

  /**
   * Toggles between open & closed popup
   */
  togglePopup() {
    if (this.isPopupOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  /**
   * Resets & opens the popup
   */
  open() {
    this.reset();
    this.isPopupOpen = true;
  }

  /** Closes the popup */
  close() {
    this.isPopupOpen = false;
  }

  /** Checks if the popup is opened */
  get isOpened(): boolean {
    return this.isPopupOpen;
  }

  /**
   * Retrieves the trimmed value of an input
   * @param name Name of the input to retrieve
   * @protected
   * @returns Trimmed value of the input
   */
  protected getValue(name: string): string {
    return this.inputs[name].value.trim()
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
   * Resets the state of the inputs. Is advised to override this method on extension.
   * @protected
   */
  protected reset() { }

  /**
   * Checks if the input is valid. Is advised to override this method on extension.
   * @protected
   */
  protected validate() {
    this.isValid = true;
  }

  /**
   * Transforms the input values for their output.
   * May or may not return an array of the same length.
   * Is advised to override this method on extension.
   * @param inputs Array of inputs as { name: inputName, value: inputValue }
   * @protected
   * @returns List of transformed values
   */
  protected transformValuesForOutput(inputs: { [input: string]: string }): { [attr: string]: string } {
    return inputs;
  }

  /**
   * Accepts the popup
   * @internal
   */
  protected acceptPopup() {

    let inputs: { [input: string]: string } = { };

    Object.keys(this.inputs).forEach(name => inputs[name] = this.getValue(name));

    inputs = this.transformValuesForOutput(inputs);
    this.acceptedPopup.emit(inputs);
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
