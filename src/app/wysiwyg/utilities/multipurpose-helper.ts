/** Multipurpose helper functions */

import {Component} from '@angular/core';

/**
 * Adds the given props to the given object
 * @param item Object to which props will be added
 * @param props Properties to add
 * @returns Reference to the given object with the updated props for chaining
 */
export function addProps<T extends object = object>(item: object, props: { [p in keyof T]?: T[p] }): T {
  const ref = item as { [p in keyof T]: T[p] };
  for (let prop in props) {
    ref[prop] = props[prop]!;
  }
  return item as T;
}

/**
 * Equality comparator between objects
 * @param a Object a
 * @param b Object b
 * @returns True if objects
 */
export function areEquals<T = any>(a?: T, b?: T): boolean {
  // Null check
  if (a == null || b == null) {
    return a == b;
  }

  // False if different types
  if (typeof (a) !== typeof (b)) {
    return false;
  }

  // Object check
  if (typeof (a) === 'object') {
    // False if not the same number of keys
    const aSize = Object.keys(a).length;
    const bSize = Object.keys(b).length;
    if (aSize !== bSize) {
      return false;
    }

    // Check every key
    for (const key in a) {

      // Check for equality on child elements
      if (!areEquals(a[key], b[key])) {
        return false;
      }
    }

    return true;
  }

  // Equality check for non object types
  else {
    return a === b;
  }
}

/**
 * Repeats an array the given times. It creates a new array.
 * @param arr Array to repeat
 * @param n Times to repeat
 * @returns New array contained the elements from arr repeated n times
 */
export function repeat<T = any>(arr: T | T[], n: number): T[] {
  const newArr = [];
  const oldArr = arr instanceof Array ? arr : [arr];
  for (let i = 0; i < n; i++) {
    newArr.push(...oldArr);
  }
  return newArr;
}

/**
 * Delays the execution of the function to the next possible time frame
 * @param func Function to execute
 */
export function executeAfter(func: () => void): void {
  setTimeout(func);
}

/**
 * Generates the style attribute for a DOM tag with the given attributes, removing all of which are undefined
 * @param styleAttrs Style attributes
 * @returns String of semicolon separated styles to insert into the style attribute value
 */
export function generateStyles(styleAttrs: { [s: string]: string | number | undefined }): string {
  const styles: string[] = [];

  for (const styleKey in styleAttrs) {
    const styleValue = styleAttrs[styleKey];
    if (styleValue != null) {
      styles.push(`${styleKey}:${styleValue}`);
    }
  }

  return styles.join(';');
}

/**
 * Defines an Angular component dynamically
 * @param data Data to pass to @Component decorator
 * @param component Component class to generate
 * @param provider Optional provider shorthand to append a provider to @Component providers param
 * @returns Definition of an Angular component
 */
export function defineComponent<T = object, R = object>(
  data: { [p in keyof Component]: Component[p] },
  component: new(...args: any[]) => T,
  provider?: new(...args: any[]) => R): { new(...args: any[]): T } {
  return Component({
    ...data,
    providers: [...(data.providers ?? []), {provide: provider, useExisting: component}],
  })(component);
}
