/**
 * Custom ProseMirror helper functions for Node content management
 */

import {Fragment, Node as ProseNode, NodeType} from "prosemirror-model";

/**
 * Returns the text contained in the node
 * - If from and to are given, the text between these positions is returned
 * - If only from is given, the text between from and the end of the node is returned
 * - If none are given, all the text from the node is returned
 * @param node Node to get the text from
 * @param from Start of the range
 * @param to End of the range
 * @returns Text contained in the range specified or all the text from the node if no range given
 */
export function textAt(node: ProseNode, from?: number, to?: number): string {
  if (from) {
    return to ? node.textBetween(from, to, '\n') : node.textBetween(from, node.content.size);
  } else {
    return node.textBetween(0, node.content.size, '\n');
  }
}

/**
 * Checks if content is valid for given node type
 * @param base Node type
 * @param content Content to check if valid
 * @returns True if content is valid inside given node type
 */
export function isValidContent(base: NodeType, content?: Fragment | ProseNode | readonly ProseNode[] | null): boolean {
  return base.validContent(Fragment.from(content));
}
