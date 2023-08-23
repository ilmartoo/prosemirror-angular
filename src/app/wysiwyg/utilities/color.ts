export function rgbColor(r: number, g: number, b: number, a?: number, options?: ColorOptions): Color {
  return ColorFactory.rgb(r, g, b, a, options);
}

export function hslColor(h: number, s: number, l: number, a?: number, options?: ColorOptions): Color {
  return ColorFactory.hsl(h, s, l, a, options);
}

export function hexColor(hexColor: `#${string}`, options?: ColorOptions): Color {
  return ColorFactory.hex(hexColor, options);
}

export function cssColor(cssColor: string, options?: ColorOptions): Color {
  return ColorFactory.css(cssColor, options);
}

export const DEFAULT_COLOR = 'inherit';

export type Color = {
  display: string;
  value: string;
  dark: boolean;
	framed: boolean,
  tooltip?: string;
};

export type ColorPalette = {
  primary?: Color,
  list: Color[],
};

export type ColorOptions = {
  default?: boolean,
  dark?: boolean,
  framed?: boolean,
	tooltip?: string,
};

class ColorFactory {
  private static newColor(display: string, options: ColorOptions = {}): Color {
    return {
      display,
      value: options.default ? '' : display,
      dark: options.dark ?? false,
      framed: options.framed ?? false,
      tooltip: options.tooltip,
    };
  }

  static rgb(r: number, g: number, b: number, a?: number, options: ColorOptions = {}): Color {
    return ColorFactory.newColor(`rgb(${r},${g},${b},${a ?? 1})`, options);
  }

  static hsl(h: number, s: number, l: number, a?: number, options: ColorOptions = {}): Color {
    return ColorFactory.newColor(`hsl(${h},${s},${l},${a ?? 1})`, options);
  }

  static hex(hexColor: `#${string}`, options: ColorOptions = {}): Color {
    return ColorFactory.newColor(hexColor, options)
  }

  static css(cssColor: string, options: ColorOptions = {}): Color {
    return ColorFactory.newColor(cssColor, options)
  }
}
