import {DOMOutputSpec, MarkSpec, NodeSpec, Schema} from 'prosemirror-model';
import {schema} from 'prosemirror-schema-basic';
import {addListNodes} from 'prosemirror-schema-list';

const baseSchema = new Schema({
  nodes: addListNodes(schema.spec.nodes, 'paragraph block*', 'block'),
  marks: schema.spec.marks,
})

const customNodes = baseSchema.spec.nodes
  .addToStart('', {} as NodeSpec)
  .addToStart('', {} as NodeSpec);


const underlineDOM: DOMOutputSpec = ['u', 0],
  strikethroughDOM: DOMOutputSpec = ['s', 0];

const customMarks = baseSchema.spec.marks

  /* Underline */
  .addToStart('underline', {
    parseDOM: [
      { tag: 'u' },
      {
        tag: ':not(a)',
        consuming: false, // If false, node will not be consumed and following ParseRules may also match with this node
        getAttrs: (dom: HTMLElement) => dom.style.textDecoration.includes("underline") || dom.style.textDecorationLine.includes("underline")
      },
    ],
    toDOM(): DOMOutputSpec { return underlineDOM },
    } as MarkSpec)

  /* Strikethrough */
  .addToStart('strikethrough', {
    parseDOM: [
      { tag: 's' },
      { tag: 'del' },
      {
        consuming: false, // If false, node will not be consumed and following ParseRules may also match with this node
        getAttrs: (dom: HTMLElement) => dom.style.textDecoration.includes("line-through") || dom.style.textDecorationLine.includes("line-through")
      },
    ],
    toDOM(): DOMOutputSpec { return strikethroughDOM },
  } as MarkSpec);

const customSchema = new Schema({
  nodes: customNodes,
  marks: customMarks,
})

export {customNodes, customMarks, customSchema}
