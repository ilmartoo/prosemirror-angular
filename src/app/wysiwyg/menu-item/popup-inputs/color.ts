export function rgbColor(r: number, g: number, b: number, a?: number, isDefault = false): Color {
  return ColorFactory.rgb(r, g, b, a, isDefault);
}

export function hslColor(h: number, s: number, l: number, a?: number, isDefault = false): Color {
  return ColorFactory.hsl(h, s, l, a, isDefault);
}

export function hexColor(hexColor: `#${string}`, isDefault = false): Color {
  return ColorFactory.hex(hexColor, isDefault);
}

export function cssColor(cssColor: string, isDefault = false): Color {
  return ColorFactory.css(cssColor, isDefault);
}

export interface Color {
  display: string;
  value: string;
}

class ColorFactory {
  private static newColor(display: string, isDefault: boolean): Color {
    return {
      display,
      value: isDefault ? '' : display
    };
  }

  static rgb(r: number, g: number, b: number, a?: number, isDefault = false): Color {
    return ColorFactory.newColor(`rgb(${r},${g},${b},${a ?? 1})`, isDefault);
  }

  static hsl(h: number, s: number, l: number, a?: number, isDefault = false): Color {
    return ColorFactory.newColor(`hsl(${h},${s},${l},${a ?? 1})`, isDefault);
  }

  static hex(hexColor: `#${string}`, isDefault = false): Color {
    return ColorFactory.newColor(hexColor, isDefault)
  }

  static css(cssColor: string, isDefault = false): Color {
    return ColorFactory.newColor(cssColor, isDefault)
  }
}
