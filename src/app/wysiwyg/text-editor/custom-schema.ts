import {
  AttributeSpec,
  Attrs,
  DOMOutputSpec,
  MarkSpec,
  Node as ProseNode,
  NodeSpec,
  ParseRule,
  Schema
} from 'prosemirror-model';
import {groupChain, groupRange} from "../utilities/node-groups-helper";
import {tableNodes} from 'prosemirror-tables';
import {generateStyles} from '../utilities/multipurpose-helper';

//// KaTeX import //////////////
const katex = require('katex');
require('katex/contrib/mhchem');
////////////////////////////////

/**
 * Helper function to ease the toDOM function declaration.
 * @param tag Tag of the HTMLElement to use. Can be a user defined tag if desired.
 * @param attrs Attributes of the HTMLElement node. If none pass an `undefined` or `null` value.
 * @param content Can be a "hole" or a DOMOutputSpec (subsequent call to toDOM).
 * @returns DOMOutputSpec created from the given parameters.
 */
export function toDOM(tag: string, attrs?: { [p: string]: string } | null, ...content: ([number] | DOMOutputSpec[])): DOMOutputSpec {
  let dom: [string, ...any[]] = [tag, ...(attrs ? [attrs] : [])];
  // With attributes
  if (content.length === 0) { return dom; }
  // With attributes & content
  return [...dom, ...content];
}

toDOM('a', null, );

/**
 * Helper function to limit the dom object to HTMLElement only, returning false if a string is passed.
 * @param dom DOM string or element.
 * @param f Function to get the attrs from the DOM element only.
 * @returns Attributes of the parsed node.
 */
export function getDOMAttrs(dom: string | HTMLElement, f: (dom: HTMLElement) => false | Attrs | null): false | Attrs | null {
  if (typeof(dom) === 'string') { return false; } // If string do not parse
  return f(dom);
}

/// Alignment ///
export enum AlignmentStyle {
  LEFT = 'left',
  CENTER = 'center',
  RIGHT = 'right',
  JUSTIFY = 'justify',
}

export enum AlignmentType {
  BLOCK = 'block',
  TEXT = 'text',
}

export enum AlignableNodeData {
  ATTR_NAME = 'alignment',
  DEFAULT_VALUE = AlignmentStyle.LEFT,
}

export type AlignableNode = ProseNode & Readonly<{ attrs: Attrs & {
  [AlignableNodeData.ATTR_NAME]: AlignmentStyle,
} }>;

/**
 * Adds all needed logic for the block to be an alignable block
 * - `alignment` attribute
 * - Updates `parseDOM` ParseRules to retrieve textAlign
 * - Adds `alignable` to NodeSpec groups
 * @param type Type of alignment to implement
 * @param spec NodeSpec to update
 * @returns Updated NodeSpec
 */
export function alignable(type: AlignmentType, spec: NodeSpec): NodeSpec {
	if (!spec.toDOM) { return spec; } // If no transformation to DOM nodes present, cannot be aligned

	const group: string = groupChain(spec.group || '', NodeGroups.ALIGNABLE);
	const attrs: {[attr: string | AlignableNodeData]: AttributeSpec} = {
		...spec.attrs,
    [AlignableNodeData.ATTR_NAME]: { default: AlignableNodeData.DEFAULT_VALUE },
	};
	const parseDOM: ParseRule[] | undefined = spec.parseDOM?.map(rule => ({
		...rule,
		getAttrs: (dom: string | HTMLElement) => getDOMAttrs(dom, (dom) => {
			const attrs = rule.getAttrs ? rule.getAttrs(dom) : rule.attrs;
			if (attrs === false) { return false; } // Do not parse if original parser cancels

			// Align type logic
      let alignment;
      // Text
      if (type === AlignmentType.TEXT) {
			  const alignStyle = dom.style.textAlign;
        if (alignStyle.includes('center')) {
          alignment = AlignmentStyle.CENTER;
        } else if (alignStyle.includes('start') || alignStyle.includes('left')) {
          alignment = AlignmentStyle.LEFT;
        } else if (alignStyle.includes('end') || alignStyle.includes('right')) {
          alignment = AlignmentStyle.RIGHT;
        } else if (alignStyle.includes('justify') || alignStyle.includes('justify-all')) {
          alignment = AlignmentStyle.JUSTIFY;
        }
      }
      // Block or Cell
      else {
				const alignStyle = dom.style.justifyContent;
				if (alignStyle.includes('center')) {
					alignment = AlignmentStyle.CENTER;
				} else if (alignStyle.includes('left')) {
					alignment = AlignmentStyle.LEFT;
				} else if (alignStyle.includes('right')) {
					alignment = AlignmentStyle.RIGHT;
				}
      }
			///////////////////

			return { ...attrs, alignment };
		})
	}));
	const toDOM: (node: ProseNode) => DOMOutputSpec = (node) => {
		const dom = spec.toDOM!(node);

		// DOMOutputSpec is a string
		if (typeof(dom) === 'string') { return dom; } // Cannot change string -> Logic too complicated

    const alignment = type !== AlignmentType.TEXT && node.attrs[AlignableNodeData.ATTR_NAME] === AlignmentStyle.JUSTIFY
      ? AlignmentStyle.LEFT
      : node.attrs[AlignableNodeData.ATTR_NAME];

		// DOMOutputSpec is an array
		if ('length' in dom) {
			const appendAlignStyles = (domAttrs: {[p: string]: string} & {style?: string} = { }) => {
				const oldStyles = domAttrs.style ? `${domAttrs.style};` : '';

        // Align type logic
        let alignStyles = '';
        // Text
        if (type === AlignmentType.TEXT) {
					alignStyles = generateStyles({
            'text-align': alignment
          });
        }
        // Block
        else if (type === AlignmentType.BLOCK) {
          alignStyles = generateStyles({
            'display': 'grid',
            'justify-content': alignment
          });
        }
				///////////////////

				return {
					...domAttrs,
					style: `${oldStyles}${alignStyles}`,
				}
			}

			if (dom.length === 1) { return [...dom, appendAlignStyles()]; } // [string, Attrs]

			const arrayLeftovers = [...dom];
      arrayLeftovers.splice(0, 2);

			// [string, Attrs, hole | DOMOutputSpec, ...]
			if (typeof(dom[1]) === 'number' || 'length' in dom[1]) { return [dom[0], appendAlignStyles(), dom[1], ...arrayLeftovers]; }
      // [string, Attrs, ...]
			if (typeof(dom[1]) === 'object') { return [dom[0], appendAlignStyles(dom[1]), ...arrayLeftovers]; }
			// Cannot change this -> Logic too complicated
			return dom;
		}

		// DOMOutputSpec is a Node or an object with `dom` as a Node
		const nodeHTML = ('dom' in dom ? dom.dom : dom) as HTMLElement;

    if (type === AlignmentType.TEXT) {
      nodeHTML.style.textAlign = alignment;
    }
    // Block
    else if (type === AlignmentType.BLOCK) {
      nodeHTML.style.display = 'grid';
      nodeHTML.style.justifyContent = alignment;
    }

		return dom;
	}

	return {
		...spec,
		group,
		attrs,
		parseDOM,
		toDOM,
	};
}

/// Custom schema's nodes & marks definitions ///

// SPECS //

// Node specs
export enum NodeSpecs {
  DOC = 'doc',
  TEXT = 'text',
  IMAGE = 'image',
  BLOCKQUOTE = 'blockquote',
  HARD_BREAK = 'hard_break',
  HORIZONTAL_RULE = 'horizontal_rule',
  INDENT = 'indent',
  PARAGRAPH = 'paragraph',
  HEADING = 'heading',
  CODE_BLOCK = 'code_block',
  LIST_ITEM = 'list_item',
  ORDERED_LIST = 'ordered_list',
  BULLET_LIST = 'bullet_list',
  TABLE = 'table',
  ROW = 'table_row',
  CELL = 'table_cell',
  HEADER = 'table_header',
  EQUATION = 'equation',
}

// Mark specs
export enum MarkSpecs {
  LINK = 'link',
  CODE = 'code',
  ITALIC = 'italic',
  BOLD = 'bold',
  UNDERLINE = 'underline',
  STRIKETHROUGH = 'strikethrough',
  SUPERSCRIPT = 'superscript',
  SUBSCRIPT = 'subscript',
  FONT_COLOR = 'font_color',
  FONT_BACKGROUND = 'font_background',
  FONT_FAMILY = 'font_family',
  FONT_SIZE = 'font_size',
}

// Node groups
export enum NodeGroups {
	BLOCK = 'block',
	LIST = 'list',
	ALIGNABLE = 'alignable',
	INLINE = 'inline',
	TEXT = 'text',
}

// List constants
const LIST_GROUPS = groupChain(NodeGroups.BLOCK, NodeGroups.LIST);
const LIST_CONTENT = groupRange(NodeSpecs.LIST_ITEM, 0);

// Indent constants
export const INDENT_LEVEL_STEP = 1;

const tableNodesMap = tableNodes({
  tableGroup: NodeGroups.BLOCK,
  cellContent: NodeGroups.BLOCK,
  cellAttributes: { }
});

// Schema nodes //
export const schemaNodes: {[node in NodeSpecs]: NodeSpec} = {
  // Doc -> Top node
  [NodeSpecs.DOC]: {
    content: groupRange(NodeGroups.BLOCK, 1),
  },
	// Text -> The text node
	[NodeSpecs.TEXT]: {
		group: NodeGroups.INLINE,
	},
  // Paragraph
  [NodeSpecs.PARAGRAPH]: alignable(AlignmentType.TEXT, {
    content: groupRange(NodeGroups.INLINE, 0),
    group: NodeGroups.BLOCK,
    parseDOM: [{
      tag: 'p'
    }],
    toDOM: () => toDOM('p', null, 0)
  }),
  // Blockquote
  [NodeSpecs.BLOCKQUOTE]: {
    content: groupRange(NodeGroups.BLOCK, 1),
    group: NodeGroups.BLOCK,
    defining: true,
    parseDOM: [{
      tag: 'blockquote'
    }],
    toDOM: () => toDOM('blockquote', null, 0),
  },
  // Horizontal rule
  [NodeSpecs.HORIZONTAL_RULE]: {
    group: NodeGroups.BLOCK,
    parseDOM: [{
      tag: 'hr'
    }],
    toDOM: () => toDOM('hr'),
  },
  // Hard break
  [NodeSpecs.HARD_BREAK]: {
    inline: true,
    group: NodeGroups.INLINE,
    selectable: false,
    parseDOM: [{
      tag: 'br'
    }],
    toDOM: () => toDOM('br'),
  },
  // Heading
  [NodeSpecs.HEADING]: alignable(AlignmentType.TEXT, {
    attrs: {
      level: { default: 1 }
    },
    content: groupRange(NodeGroups.INLINE, 0),
    group: NodeGroups.BLOCK,
    defining: true,
    parseDOM: [
      { tag: 'h1', attrs: { level: 1 } },
      { tag: 'h2', attrs: { level: 2 } },
      { tag: 'h3', attrs: { level: 3 } },
      { tag: 'h4', attrs: { level: 3 } }, // Max level is 3
      { tag: 'h5', attrs: { level: 3 } }, // Max level is 3
      { tag: 'h6', attrs: { level: 3 } }, // Max level is 3
    ],
    marks: groupChain(
      MarkSpecs.BOLD,
      MarkSpecs.ITALIC,
      MarkSpecs.LINK,
      MarkSpecs.SUPERSCRIPT,
      MarkSpecs.SUBSCRIPT,
      MarkSpecs.FONT_FAMILY,
      MarkSpecs.FONT_BACKGROUND,
      MarkSpecs.FONT_COLOR,
      MarkSpecs.STRIKETHROUGH,
      MarkSpecs.UNDERLINE,
    ),
    toDOM: (node) => toDOM(`h${node.attrs['level']}`, null, 0),
  }),
  // Code block
  [NodeSpecs.CODE_BLOCK]: {
    content: groupRange(NodeGroups.TEXT, 0),
    group: NodeGroups.BLOCK,
    marks: MarkSpecs.FONT_SIZE,
    code: true,
    defining: true,
    parseDOM: [{
      tag: 'pre',
      preserveWhitespace: 'full',
    }],
    toDOM: () => toDOM('pre', null, toDOM('code', null, 0)),
  },
  // Image
  [NodeSpecs.IMAGE]: alignable(AlignmentType.BLOCK, {
    attrs: {
      src: { },
      alt: { default: null },
      title: { default: null },
    },
    group: NodeGroups.BLOCK,
		content: groupRange(NodeGroups.INLINE, 0, 0),
    draggable: true,
    atom: true,
    selectable: true,
    isolating: true,
		leafText: (node) => node.attrs['src'],
		marks: '',
    parseDOM: [{
      tag: 'img[src]',
      getAttrs: (dom) => getDOMAttrs(dom, (dom) => ({
        src: dom.getAttribute('src'),
        title: dom.getAttribute('title'),
        alt: dom.getAttribute('alt')
      }))
    }],
    toDOM: (node) => toDOM('div', {class: 'img-wrapper atom'},
			toDOM('div', {class: 'img-card'},
        toDOM('img', node.attrs),
        toDOM('span', {class: 'img-title'}, `— ${node.attrs['title']} —`),
      ),
    ),
  }),
  // Ordered list
  [NodeSpecs.ORDERED_LIST]: {
    content: LIST_CONTENT,
    group: LIST_GROUPS,
    attrs: {
      order: { default: 1 }
    },
    parseDOM: [{
      tag: 'ol',
      getAttrs: (dom) => getDOMAttrs(dom, (dom) => ({
        order: dom.hasAttribute("start") ? +dom.getAttribute("start")! : 1
      })),
    }],
    toDOM: (node) => toDOM('ol', {start: node.attrs['order']}, 0),
  },
	// Bullet list
	[NodeSpecs.BULLET_LIST]: {
		content: LIST_CONTENT,
		group: LIST_GROUPS,
    parseDOM: [{
      tag: 'ul',
    }],
    toDOM: () => toDOM('ul', null, 0),
	},
  // List item
  [NodeSpecs.LIST_ITEM]: {
    content: groupChain(NodeSpecs.PARAGRAPH, groupRange(NodeGroups.LIST, 0, 1)),
    defining: true,
    parseDOM: [{
      tag: 'li',
    }],
    toDOM: () => toDOM('li', null, 0),
  },
  // Indent
  [NodeSpecs.INDENT]: {
    content: groupRange(NodeGroups.BLOCK, 0),
    group: NodeGroups.BLOCK,
    attrs: {
      level: { default: INDENT_LEVEL_STEP },
    },
    parseDOM: [
      {
        tag: '*.indent',
        getAttrs: (dom) => getDOMAttrs(dom, (dom) => {
          return '--indent-level' in dom.style ? { level: dom.style['--indent-level'] } : null;
        }),
      },
    ],
    toDOM: (node) => toDOM('div', {
      class: 'indent',
			style: generateStyles({'--indent-level': node.attrs['level']}),
		}, 0),
  },
  // Table nodes
  [NodeSpecs.TABLE]: {
    ...tableNodesMap.table,
    toDOM: (node) => toDOM(
      'div',
      {class: 'table-wrapper'},
      tableNodesMap.table.toDOM!(node)
    ),
  },
  [NodeSpecs.ROW]: tableNodesMap.table_row,
  [NodeSpecs.HEADER]: tableNodesMap.table_header,
  [NodeSpecs.CELL]: tableNodesMap.table_cell,
  // KaTeX formula
  [NodeSpecs.EQUATION]: {
		attrs: {
			formula: { }
		},
    group: NodeGroups.INLINE,
    content: groupRange(NodeGroups.INLINE, 0, 0),
    inline: true,
		draggable: true,
		atom: true,
    selectable: true,
		isolating: true,
		leafText: (node) => node.attrs['formula'],
		marks: '',
    parseDOM: [{
      tag: '*[katex-formula]',
			getAttrs: (dom) => getDOMAttrs(dom, (dom) => {
				const formula = dom.getAttribute('katex-formula')
				return formula ? {formula} : false;
			}),
    }],
    toDOM: (node) => {
			const formula = node.attrs['formula'] as string;

      const katexWrapper = document.createElement('div');
      katex.render(formula, katexWrapper, {
				throwOnError: false,
				output: 'html',
			});
      const katexNode = katexWrapper.firstElementChild! as HTMLSpanElement;
      katexNode.setAttribute('katex-formula', formula); // Add formula
      katexNode.classList.add('atom'); // Add atom class
      return katexNode;
		},
  },
};

// Schema marks //
export const schemaMarks: {[mark in MarkSpecs]: MarkSpec} = {
  // Text color
  [MarkSpecs.FONT_COLOR]: {
    attrs: {
      color: { },
    },
    parseDOM: [{
      tag: '*',
      consuming: false,
      getAttrs: (dom) => getDOMAttrs(dom, (dom) => {
        const color = dom.style.color;
        return color ? { color } : false;
      }),
    }],
    toDOM: (mark) => toDOM('span', {
      class: 'font-color',
      style: generateStyles({'--font-color': mark.attrs['color']})
    }, 0),
  },
  // Background color
  [MarkSpecs.FONT_BACKGROUND]: {
    attrs: {
      color: { },
    },
    parseDOM: [{
      tag: '*',
      consuming: false,
      getAttrs: (dom) => getDOMAttrs(dom, (dom) => {
        const color = dom.style.backgroundColor;
        return color ? { color } : false;
      }),
    }],
    toDOM: (mark) => toDOM('span', {
      class: 'font-background',
      style: generateStyles({'--font-background': mark.attrs['color']})
    }, 0),
  },
  // Font family
  [MarkSpecs.FONT_FAMILY]: {
    attrs: {
      family: { },
    },
    parseDOM: [{
      tag: '*',
      consuming: false,
      getAttrs: (dom) => getDOMAttrs(dom, (dom) => {
        const family = dom.style.fontFamily;
        return family ? { family } : false;
      }),
    }],
    toDOM: (mark) => toDOM('span', {
      class: 'font-family',
      style: generateStyles({'--font-family': mark.attrs['family']})
    }, 0),
  },
  // Font size
  [MarkSpecs.FONT_SIZE]: {
    attrs: {
      size: { },
    },
    parseDOM: [{
      tag: '*',
      consuming: false,
      getAttrs: (dom) => getDOMAttrs(dom, (dom) => {
        const size = dom.style.fontSize;
        return size ? { size } : false;
      }),
    }],
    toDOM: (mark) => toDOM('span', {
      class: 'font-size',
      style: generateStyles({'--font-size': mark.attrs['size']})
    }, 0),
  },
  // Link
  [MarkSpecs.LINK]: {
    attrs: {
      href: { },
      title: { default: null }
    },
    inclusive: false,
    parseDOM: [{
      tag: 'a[href]',
      getAttrs: (dom) => getDOMAttrs(dom, (dom) => {
        return {href: dom.getAttribute('href'), title: dom.getAttribute('title')}
      }),
    }],
    toDOM: (mark) => toDOM('a', mark.attrs, 0),
    // Excludes underline of being active when a link mark is
    excludes: groupChain(MarkSpecs.LINK, MarkSpecs.UNDERLINE, MarkSpecs.FONT_COLOR),
  },
  // Italic
  [MarkSpecs.ITALIC]: {
    parseDOM: [
      { tag: 'i' },
      { tag: 'em' },
      { style: 'font-style=italic' },
      {
        style: 'font-style=normal',
        clearMark: m => m.type.name === 'em',
      }
    ],
    toDOM: () => toDOM('em', null, 0),
  },
  // Bold
  [MarkSpecs.BOLD]: {
    parseDOM: [
      { tag: 'strong' },
      {
        tag: 'b',
        getAttrs: (dom) => getDOMAttrs(dom, (dom) => {
          return dom.style.fontWeight != 'normal' && null
        }),
      },
      {
        style: 'font-weight=400',
        clearMark: m => m.type.name == 'strong',
      },
    ],
    toDOM: () => toDOM('strong', null, 0),
  },
  // Code
  [MarkSpecs.CODE]: {
    parseDOM: [{
      tag: 'code'
    }],
    toDOM: () => toDOM('code', null, 0),
    // Excludes all text modification marks
    excludes: groupChain(
      MarkSpecs.CODE,
      MarkSpecs.FONT_COLOR,
      MarkSpecs.FONT_BACKGROUND,
      MarkSpecs.FONT_FAMILY,
      MarkSpecs.SUPERSCRIPT,
      MarkSpecs.SUBSCRIPT,
    ),
  },
  // Underline
  [MarkSpecs.UNDERLINE]: {
    parseDOM: [
      { tag: 'u' },
      {
        tag: ':not(a)',
        getAttrs: (dom) => getDOMAttrs(dom, (dom) =>
          dom.style.textDecoration.includes('underline')
          || dom.style.textDecorationLine.includes('underline')
            ? null
            : false
        ),
      },
    ],
    toDOM: () => toDOM('u', null, 0),
    excludes: MarkSpecs.FONT_SIZE,
  },
  // Strikethrough
  [MarkSpecs.STRIKETHROUGH]: {
    parseDOM: [
      { tag: 's' },
      { tag: 'del' },
      {
        getAttrs: (dom) => getDOMAttrs(dom, (dom) =>
          dom.style.textDecoration.includes('line-through')
          || dom.style.textDecorationLine.includes('line-through')
            ? null
            : false
        ),
      },
    ],
    toDOM: () => toDOM('s', null, 0),
    excludes: MarkSpecs.FONT_SIZE,
  },
  // Superscript
  [MarkSpecs.SUPERSCRIPT]: {
    parseDOM: [{
      tag: 'sup'
    }],
    toDOM: () => toDOM('sup', null, 0),
    excludes: groupChain(
      MarkSpecs.SUBSCRIPT,
      MarkSpecs.SUPERSCRIPT,
    ),
  },
  // Subscript
  [MarkSpecs.SUBSCRIPT]: {
    parseDOM: [{
      tag: 'sub'
    }],
    toDOM: () => toDOM('sub', null, 0),
    excludes: groupChain(
      MarkSpecs.SUBSCRIPT,
      MarkSpecs.SUPERSCRIPT,
    ),
  },
};

/// CUSTOM SCHEMA ///
export const customSchema = new Schema<NodeSpecs, MarkSpecs>({
  nodes: schemaNodes,
  marks: schemaMarks,
});

// Types
export const nodeTypes = customSchema.nodes;
export const markTypes = customSchema.marks;
