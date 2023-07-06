/**
 * Custom ProseMirror helper functions for Node content management
 */

import {Fragment, Node as ProseNode, NodeType} from "prosemirror-model";

/**
 * Retrieves the text contained in the node between the given positions
 * @param node Node to get the text from
 * @param from Start of the range
 * @param to End of the range
 * @returns Text contained in the range specified
 */
export function textBetween(node: ProseNode, from: number, to: number): string {
  return node.textBetween(from, to, '\n');
}

/**
 * Retrieves the text contained in the node
 * @param node Node to get the text from
 * @returns Text contained in the node
 */
export function textInside(node: ProseNode): string {
  return node.textBetween(0, node.content.size, '\n');
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
