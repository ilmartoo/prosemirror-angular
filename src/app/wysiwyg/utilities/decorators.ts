/** Custom ProseMirror decorator functions */


import {Decoration, DecorationSet} from "prosemirror-view";
import {Plugin} from "prosemirror-state";

export function currentElementDecorator(): Plugin {
  return new Plugin({
    props: {
      decorations(state) {
        const selection = state.selection;

        const resolved = state.doc.resolve(selection.from);
        const decoration = Decoration.node(resolved.before(), resolved.after(), {class: 'current-element'});
        // This is equivalent to:
        // const decoration = Decoration.node(resolved.start() - 1, resolved.end() + 1, {class: 'current-element'});
        return DecorationSet.create(state.doc, [decoration]);
      }
    }
  })
}

export function selectedNodesDecorator(): Plugin {
  return new Plugin({
    props: {
      decorations(state) {
        const selection = state.selection;
        const decorations: Decoration[] = [];

        state.doc.nodesBetween(selection.from, selection.to, (node, position) => {
          if (node.isBlock) {
            decorations.push(Decoration.node(position, position + node.nodeSize, {class: 'selection'}));
          }
        });

        return DecorationSet.create(state.doc, decorations);
      }
    }
  })
}

export function debugSelection(): Plugin {
  return new Plugin({
    view: () =>  {
      return {
        update: (view, prevState) => {
          // console.log('DEBUG Selection Plugin - previous $pos: (',
          //   prevState.selection.from, prevState.selection.to,
          //   ') (',
          //   prevState.selection.$from, prevState.selection.$to,
          //   ') (',
          //   prevState.selection.$from.node(), prevState.selection.$to.node(),
          //   ')'
          // );
          console.log('DEBUG Selection Plugin - current $pos: (',
            view.state.selection.from, view.state.selection.to,
            ') (',
            view.state.selection.$from, view.state.selection.$to,
            ') (',
            view.state.selection.$from.node(), view.state.selection.$to.node(),
            ')');
        }
      }
    }
  })
}
