import {Attrs, DOMOutputSpec, Schema} from 'prosemirror-model';
import {schema} from 'prosemirror-schema-basic';
import {bulletList, listItem, orderedList} from 'prosemirror-schema-list';

import {groupChain, groupOr, groupRange} from "../utilities/node-groups-helper";
import {tableNodes} from 'prosemirror-tables';


///
/// Base schema
///
const baseSchema = new Schema({
  nodes:
    schema.spec.nodes ||
    tableNodes({ tableGroup: 'block', cellContent: 'block', cellAttributes: {} }),
  marks: schema.spec.marks,
})


///
/// Custom schema's nodes definition
///
const indentDOM: DOMOutputSpec = ['indent', 0];

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

const customNodes = baseSchema.spec.nodes

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
    content: 'paragraph',
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
const underlineDOM: DOMOutputSpec = ['u', 0],
  strikethroughDOM: DOMOutputSpec = ['s', 0];

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
  BACKGROUND = 'bg',
  ITALIC = 'em',
  BOLD = 'strong',
}
type CustomMarkSpec = SpecialMarkSpecs | DecorationMarkSpecs | StyleMarkSpecs;

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

  .update(SpecialMarkSpecs.LINK,  {
    ...baseSchema.spec.marks.get('link'),
    excludes: groupChain(SpecialMarkSpecs.LINK, DecorationMarkSpecs.UNDERLINE), // Excludes underline of being active when a link mark is
  });


///
/// Custom schema definition
///
const customSchema = new Schema<CustomNodeSpec, CustomMarkSpec>({
  nodes: customNodes,
  marks: customMarks,
})

// Schema
export { customNodes, customMarks, customSchema }
// Specs
export { CustomNodeSpec, SpecialNodeSpecs, TextContainerNodeSpecs, ListNodeSpecs, TableNodeSpecs }
export { CustomMarkSpec, SpecialMarkSpecs, DecorationMarkSpecs, StyleMarkSpecs }
// Groups
export { blockGroup, listGroup, listGroups }
