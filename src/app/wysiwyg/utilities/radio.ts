export function radioValue(display: string, value: string): RadioValue {
  return RadioFactory.newValue(display, value);
}

export function radioDefaultValue(display: string): RadioValue {
  return RadioFactory.newDefault(display);
}

export type RadioValue = {
  display: string;
  value: string;
};

export type Radio = RadioValue[];

class RadioFactory {
  static newValue(display: string, value: string): RadioValue {
    return {
      display,
      value,
    };
  }

  static newDefault(display: string): RadioValue {
    return {
      display,
      value: '',
    };
  }
}
