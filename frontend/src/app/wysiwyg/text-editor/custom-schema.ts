import {Attrs, DOMOutputSpec, MarkSpec, Schema} from 'prosemirror-model';
import {schema} from 'prosemirror-schema-basic';
import {addListNodes} from 'prosemirror-schema-list';


///
/// Base schema
///
const baseSchema = new Schema({
  nodes: addListNodes(schema.spec.nodes, 'paragraph block*', 'block'),
  marks: schema.spec.marks,
})


///
/// Custom schema's nodes definition
///
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
  'bullet_list';

const customNodes = baseSchema.spec.nodes;


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
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Underline
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  .addToStart('underline', {
    parseDOM: [
      { tag: 'u' },
      {
        tag: ':not(a)',
        getAttrs: (dom: string | HTMLElement): false | Attrs | null => {
          if (typeof(dom) === 'string') { return false; } // If string do not parse
          return (
            dom.style.textDecoration.includes("underline") ||
            dom.style.textDecorationLine.includes("underline")
          ) ? null : false;
        },
      },
    ],
    toDOM: (): DOMOutputSpec => underlineDOM,
    } as MarkSpec)
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Strikethrough
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  .addToStart('strikethrough', {
    parseDOM: [
      { tag: 's' },
      { tag: 'del' },
      {
        getAttrs: (dom: string | HTMLElement): false | Attrs | null => {
          if (typeof(dom) === 'string') { return false; } // If string do not parse
          return (
            dom.style.textDecoration.includes("line-through") ||
            dom.style.textDecorationLine.includes("line-through")
          ) ? null : false;
        },
      },
    ],
    toDOM: (): DOMOutputSpec => strikethroughDOM,
  });


///
/// Custom schema definition
///
const customSchema = new Schema<CustomNodeSpec, CustomMarkSpec>({
  nodes: customNodes,
  marks: customMarks,
})

export {customNodes, customMarks, customSchema, CustomMarkSpec, CustomNodeSpec}
