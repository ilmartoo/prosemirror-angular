import {Attrs, DOMOutputSpec, Schema} from 'prosemirror-model';
import {schema} from 'prosemirror-schema-basic';
import {bulletList, listItem, orderedList} from 'prosemirror-schema-list';

import {groupChain, groupOr, groupRange} from "../utilities/node-groups-helper";


///
/// Base schema
///
const baseSchema = new Schema({
  nodes: schema.spec.nodes,
  marks: schema.spec.marks,
})


///
/// Custom schema's nodes definition
///
const indentDOM: DOMOutputSpec = ['div', { class: 'indent' }, 0];

// Node groups
const blockGroup = 'block';
const listGroup = 'list';
const listGroups = groupChain(blockGroup, listGroup);

// Node contents
const listContent = groupRange(groupOr('list_item', listGroup), 0);
const indentContent = groupRange(blockGroup, 0);

type CustomNodeSpec =
  'blockquote' |
  'image' |
  'text' |
  'doc' |
  'paragraph' |
  'horizontal_rule' |
  'heading' |
  'code_block' |
  'hard_break' |
  'list_item' |
  'ordered_list' |
  'bullet_list' |
  'indent';

const customNodes = baseSchema.spec.nodes

  /// Ordered list
  .update('ordered_list', {
    ...orderedList,
    content: listContent,
    group: listGroups,
  })

  /// Bullet list
  .update('bullet_list', {
    ...bulletList,
    content: listContent,
    group: listGroups,
  })

  /// List item
  .update('list_item', {
    ...listItem,
    content: 'paragraph',
  })

  /// Indent
  .update('indent', {
    content: indentContent,
    group: blockGroup,
    parseDOM: [
      {
        tag: 'div',
        getAttrs: (dom: string | HTMLElement): false | Attrs | null => {
          if (typeof(dom) === 'string') { return false; } // If string do not parse
          return dom.classList.contains('indent') ? null : false;
        },
      },
    ],
    toDOM: (): DOMOutputSpec => indentDOM,
  });


///
/// Custom schema's marks definition
///
const underlineDOM: DOMOutputSpec = ['u', 0],
  strikethroughDOM: DOMOutputSpec = ['s', 0];

type CustomMarkSpec =
  'underline' |
  'strikethrough' |
  'link' |
  'code' |
  'em' |
  'strong';

const customMarks = baseSchema.spec.marks

  /// Underline
  .update('underline', {
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
  .update('strikethrough', {
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

  .update('link',  {
    ...baseSchema.spec.marks.get('link'),
    excludes: 'link underline', // Excludes underline of being active when a link mark is
  });


///
/// Custom schema definition
///
const customSchema = new Schema<CustomNodeSpec, CustomMarkSpec>({
  nodes: customNodes,
  marks: customMarks,
})

// Schema
export {customNodes, customMarks, customSchema, CustomMarkSpec, CustomNodeSpec}
// Groups
export {blockGroup, listGroup, listGroups}
