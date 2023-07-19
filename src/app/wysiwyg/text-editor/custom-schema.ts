import {Attrs, DOMOutputSpec, Mark, Schema} from 'prosemirror-model';
import {schema} from 'prosemirror-schema-basic';
import {bulletList, listItem, orderedList} from 'prosemirror-schema-list';

import {groupChain, groupOr, groupRange} from "../utilities/node-groups-helper";
import {tableNodes} from 'prosemirror-tables';


///
/// Base schema
///
const baseSchema = new Schema({
  nodes: schema.spec.nodes.append(
    tableNodes({ tableGroup: 'block', cellContent: 'block', cellAttributes: {} })
  ),
  marks: schema.spec.marks,
})


///
/// Custom schema's nodes definition
///

// Node groups
const blockGroup = 'block';
const listGroup = 'list';
const listGroups = groupChain(blockGroup, listGroup);

// Node contents
const listContent = groupRange(groupOr('list_item', listGroup), 0);
const indentContent = groupRange(blockGroup, 0);

// Node specs
enum SpecialNodeSpecs {
  DOC = 'doc',
  TEXT = 'text',
  IMAGE = 'image',
  BLOCKQUOTE = 'blockquote',
  HARD_BREAK = 'hard_break',
  HORIZONTAL_RULE = 'horizontal_rule',
  INDENT = 'indent',
}
enum TextContainerNodeSpecs {
  PARAGRAPH = 'paragraph',
  HEADING = 'heading',
  CODE_BLOCK = 'code_block',
}
enum ListNodeSpecs {
  LIST_ITEM = 'list_item',
  ORDERED_LIST = 'ordered_list',
  BULLET_LIST = 'bullet_list',
  CHECK_LIST = 'check_list',
}
enum TableNodeSpecs {
  TABLE = 'table',
  ROW = 'table_row',
  CELL = 'table_cell',
  HEADER = 'table_header',
}
type CustomNodeSpec = SpecialNodeSpecs | TextContainerNodeSpecs | ListNodeSpecs | TableNodeSpecs;

// DOM specs
const indentDOM: DOMOutputSpec = ['indent', 0];

const customNodes = baseSchema.spec.nodes

  /// Ordered list
  .update(SpecialNodeSpecs.IMAGE, {
    ...baseSchema.spec.nodes.get(SpecialNodeSpecs.IMAGE),
    inline: false,
    content: TextContainerNodeSpecs.PARAGRAPH,
    group: blockGroup,
  })

  /// Ordered list
  .update(ListNodeSpecs.ORDERED_LIST, {
    ...orderedList,
    content: listContent,
    group: listGroups,
  })

  /// Bullet list
  .update(ListNodeSpecs.BULLET_LIST, {
    ...bulletList,
    content: listContent,
    group: listGroups,
  })

  /// List item
  .update(ListNodeSpecs.LIST_ITEM, {
    ...listItem,
    content: TextContainerNodeSpecs.PARAGRAPH,
  })

  /// Indent
  .update(SpecialNodeSpecs.INDENT, {
    content: indentContent,
    group: blockGroup,
    parseDOM: [
      { tag: 'indent' },
    ],
    toDOM: (): DOMOutputSpec => indentDOM,
  });


///
/// Custom schema's marks definition
///

// Mark specs
enum SpecialMarkSpecs {
  LINK = 'link',
  INLINE_CODE = 'code',
}
enum DecorationMarkSpecs {
  UNDERLINE = 'underline',
  STRIKETHROUGH = 'strikethrough',
}
enum StyleMarkSpecs {
  COLOR = 'color',
  BACKGROUND = 'background',
  ITALIC = 'em',
  BOLD = 'strong',
  SUPERSCRIPT = 'superscript',
  SUBSCRIPT = 'subscript',
}
type CustomMarkSpec = SpecialMarkSpecs | DecorationMarkSpecs | StyleMarkSpecs;

// DOM specs
const underlineDOM: DOMOutputSpec = ['u', 0];
const strikethroughDOM: DOMOutputSpec = ['s', 0];
const colorDOM = (color?: string): DOMOutputSpec => ['color', { color: color }, 0];
const backgroundDOM = (color?: string): DOMOutputSpec => ['background', { color: color }, 0];
const superscriptDOM: DOMOutputSpec = ['sup', 0];
const subscriptDOM: DOMOutputSpec = ['sub', 0];

const customMarks = baseSchema.spec.marks

  /// Underline
  .update(DecorationMarkSpecs.UNDERLINE, {
    parseDOM: [
      { tag: 'u' },
      {
        tag: ':not(a)',
        getAttrs: (dom: string | HTMLElement): false | Attrs | null => {
          if (typeof(dom) === 'string') { return false; } // If string do not parse
          return (
            dom.style.textDecoration.includes('underline') ||
            dom.style.textDecorationLine.includes('underline')
          ) ? null : false;
        },
      },
    ],
    toDOM: (): DOMOutputSpec => underlineDOM,
  })

  /// Strikethrough
  .update(DecorationMarkSpecs.STRIKETHROUGH, {
    parseDOM: [
      { tag: 's' },
      { tag: 'del' },
      {
        getAttrs: (dom: string | HTMLElement): false | Attrs | null => {
          if (typeof(dom) === 'string') { return false; } // If string do not parse
          return (
            dom.style.textDecoration.includes('line-through') ||
            dom.style.textDecorationLine.includes('line-through')
          ) ? null : false;
        },
      },
    ],
    toDOM: (): DOMOutputSpec => strikethroughDOM,
  })

  // Color
  .update(StyleMarkSpecs.COLOR, {
    parseDOM: [{
      tag: 'color',
      getAttrs: (dom: string | HTMLElement): false | Attrs | null => {
        if (typeof(dom) === 'string') { return false; } // If string do not parse
        return { color: dom.style.color };
      },
    }],
    toDOM: (mark: Mark): DOMOutputSpec => colorDOM(mark.attrs['color']),
  })

  // Background
  .update(StyleMarkSpecs.BACKGROUND, {
    parseDOM: [{
      tag: 'background',
      getAttrs: (dom: string | HTMLElement): false | Attrs | null => {
        if (typeof(dom) === 'string') { return false; } // If string do not parse
        return { color: dom.style.color };
      },
    }],
    toDOM: (mark: Mark): DOMOutputSpec => backgroundDOM(mark.attrs['color']),
  })

  // Superscript
  .update(StyleMarkSpecs.SUPERSCRIPT, {
    parseDOM: [{ tag: 'sup' }],
    toDOM: (): DOMOutputSpec => superscriptDOM,
    excludes: groupChain(StyleMarkSpecs.SUPERSCRIPT, StyleMarkSpecs.SUBSCRIPT),
  })

  // Subscript
  .update(StyleMarkSpecs.SUBSCRIPT, {
    parseDOM: [{ tag: 'sub' }],
    toDOM: (): DOMOutputSpec => subscriptDOM,
    excludes: groupChain(StyleMarkSpecs.SUBSCRIPT, StyleMarkSpecs.SUPERSCRIPT),
  })

  // Link
  .update(SpecialMarkSpecs.LINK,  {
    ...baseSchema.spec.marks.get(SpecialMarkSpecs.LINK),
    // Excludes underline of being active when a link mark is
    excludes: groupChain(SpecialMarkSpecs.LINK, DecorationMarkSpecs.UNDERLINE),
  })

  // Inline code
  .update(SpecialMarkSpecs.INLINE_CODE, {
    ...baseSchema.spec.marks.get(SpecialMarkSpecs.INLINE_CODE),
    // Excludes color, superscript & subscript of being active when an inline code mark is
    excludes: groupChain(SpecialMarkSpecs.INLINE_CODE, StyleMarkSpecs.COLOR, StyleMarkSpecs.SUPERSCRIPT, StyleMarkSpecs.SUBSCRIPT),
  }) ;


///
/// Custom schema definition
///
const customSchema = new Schema<CustomNodeSpec, CustomMarkSpec>({
  nodes: customNodes,
  marks: customMarks,
})

const NODE_TYPES = customSchema.nodes;
const MARK_TYPES = customSchema.marks;

// Schema
export { customSchema, NODE_TYPES, MARK_TYPES }
// Specs
export { CustomNodeSpec, SpecialNodeSpecs, TextContainerNodeSpecs, ListNodeSpecs, TableNodeSpecs }
export { CustomMarkSpec, SpecialMarkSpecs, DecorationMarkSpecs, StyleMarkSpecs }
// Groups
export { blockGroup, listGroup, listGroups }
