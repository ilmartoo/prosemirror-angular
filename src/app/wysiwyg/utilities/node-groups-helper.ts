/** Management functions for ProseMirror Node groups & content */

/**
 * Creates a concatenation from multiple group strings
 * @param groups Array of group strings
 * @returns String of a concatenated group expression
 */
export function groupChain(...groups: [string, string, ...string[]]): string {
  return groups.join(' ');
}

/**
 * Creates a group OR expression from two or more groups
 * @param groupA First group string to OR
 * @param groups Group strings to OR
 * @returns String of an OR group expression as `(item_a | item_b [| item_c...])`
 */
export function groupOr(groupA: string, ...groups: string[]): string {
  return `(${groupA}|${groups.join('|')})`;
}

/**
 * Creates a repeated group string
 * @param group Group string to repeat
 * @param rep Number of repetitions [1, Inf)
 * @returns String of a repeat group expression
 */
export function groupRepeat(group: string, rep: number): string {
  if (rep > 0) { return `${group}{${rep}}`; } // group{rep}
  return ''; // No rep wanted so no group should be returned
}

/**
 * Creates a ranged group string
 * @param group Group to range
 * @param min Minimum repetitions of the group
 * @param max Maximum repetitions of the group
 * @returns String of a ranged group expression
 */
export function groupRange(group: string, min: number, max?: number): string {
  if (!max) {
    if (min <= 0) { return `${group}*`; }       // group* -> [0, INF)
    else if (min === 1) { return `${group}+`; } // group+ -> [1, INF]
    else { return `${group}{${min},}`; }        // group{min,} -> [min, INF)
  }

  if (min > max) { return groupRange(group, max, min); } // min <-> max

  return min === max
    ? `${group}{${min}}`         // group{rep} -> min = max
    : `${group}{${min},${max}}`; // group{min,max} -> [min, max]
}
