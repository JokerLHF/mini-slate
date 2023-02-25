import React from "react";
import { Ancestor, Descendant, Editor, Element, Range } from "slate";
import { RenderElementProps, RenderLeafProps } from "../components/editable";
import ElementComponent from '../components/element';
import TextComponent from '../components/text';
import { ReactEditor } from "../plugin/react-editor";
import { NODE_TO_INDEX, NODE_TO_PARENT } from "../utils/weak-map";
import { SelectedContext } from "./use-selected";
import { useSlate } from "./use-slate";

export const useChildren = (props: {
  node: Ancestor
  renderElement?: (props: RenderElementProps) => JSX.Element,
  renderLeaf?: (props: RenderLeafProps) => JSX.Element,
  decorations: Range[],
  selection: Range | null
}) => {
  const {
    node,
    renderElement,
    renderLeaf,
    decorations,
    selection,
  } = props;

  const editor = useSlate();
  const path = ReactEditor.findPath(editor, node);
  const children: JSX.Element[] = [];

  for (let i = 0; i < node.children.length; i++) {
    const p = path.concat(i)
    const n = node.children[i] as Descendant;
    const key = ReactEditor.findKey(editor, n);
    const range = Editor.range(editor, p);
    // 选区存在交集就代表被选中
    const sel = selection && Range.intersection(range, selection);

    if (Element.isElement(n)) {
      children.push(
        <SelectedContext.Provider value={!!sel} key={key.id}>
          <ElementComponent
            decorations={decorations}
            element={n}
            renderElement={renderElement}
            renderLeaf={renderLeaf}
            selection={selection}
          />
        </SelectedContext.Provider>
      )
    } else {
      children.push(
        <TextComponent
          decorations={decorations}
          text={n}
          renderLeaf={renderLeaf}
          key={key.id}
          parent={node}
        />
      )
    }

    NODE_TO_INDEX.set(n, i);
    NODE_TO_PARENT.set(n, node)
  }
  
  return children;
}