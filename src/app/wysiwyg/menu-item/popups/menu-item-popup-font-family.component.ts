import {MenuItemPopupForActionComponent} from './menu-item-popup-for-action.component';
import {Component} from '@angular/core';
import {MarkType} from 'prosemirror-model';
import {EditorState} from 'prosemirror-state';
import {cursorActiveElements} from '../../menu/menu.component';
import {markTypes} from '../../text-editor/custom-schema';
import {Radio, radioDefaultValue, RadioValue, radioValue} from '../../utilities/radio';
import {generateStyles} from '../../utilities/multipurpose-helper';

@Component({
  selector: 'app-menu-item-popup-font-family',
  templateUrl: './menu-item-popup-font-family.component.html',
  styleUrls: ['./menu-item-action-popup.component.scss'],
})
export class MenuItemPopupFontFamilyComponent extends MenuItemPopupForActionComponent<MarkType> {
  protected readonly INPUTS = {
    RADIO: 'radio',
  }

  protected readonly radio: Radio = [
    radioDefaultValue('Helvetica'),
    radioValue('Roboto', 'RobotoRegular, sans-serif'),
    radioValue('Criativa', 'CriativaSansRegular, sans-serif'),
    radioValue('Gauge', 'GaugeRegular, sans-serif'),
    radioValue('Sorts Mill Goudy', 'SortsMillGoudyTTRegular, serif'),
    radioValue('Geometric', 'GeometricSansSerifv1Regular, serif'),
    radioValue('CMU Concrete', 'CMUConcreteRoman, serif'),
    radioValue('Courier New', '\"Courier New\", monospace'),
    radioValue('Interval', 'IntervalBook, monospace'),
    radioValue('DejaVu', 'DejaVuMarkupBook, monospace'),
    radioValue('Comic Relief', 'ComicReliefRegular, fantasy'),
    radioValue('GFS Ambrosia', 'GFSAmbrosiaRegular, fantasy'),
  ];

  protected readonly radioValueStyle = (radioValue: RadioValue): string => generateStyles({
    'font-family': radioValue.value || undefined
  });

  protected override reset(state: EditorState) {
    const elements = cursorActiveElements(state);

    const familyMark = elements.hasMarkType(markTypes.font_family);
    let family = familyMark?.attrs['family'] as string || '';
    this.setValue(this.INPUTS.RADIO, family);
  }

  protected override transformValuesForOutput(inputs: { [input: string]: string }): { [input: string]: any } {
    return {
      family: inputs[this.INPUTS.RADIO] || undefined,
    };
  }
}
