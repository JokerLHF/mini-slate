import React from "react";
import { Ancestor, Descendant, Element, Range } from "slate";
import { RenderElementProps, RenderLeafProps } from "../components/editable";
import ElementComponent from '../components/element';
import TextComponent from '../components/text';
import { ReactEditor } from "../plugin/react-editor";
import { NODE_TO_INDEX, NODE_TO_PARENT } from "../utils/weak-map";
import { useSlate } from "./use-slate";

export const useChildren = (props: {
  node: Ancestor
  renderElement?: (props: RenderElementProps) => JSX.Element,
  renderLeaf?: (props: RenderLeafProps) => JSX.Element,
  decorations: Range[],
}) => {
  const {
    node,
    renderElement,
    renderLeaf,
    decorations
  } = props;

  const editor = useSlate();

  const children: JSX.Element[] = [];
  for (let i = 0; i < node.children.length; i++) {
    const n = node.children[i] as Descendant;
    const key = ReactEditor.findKey(editor, n);
  
    if (Element.isElement(n)) {
      children.push(
        <ElementComponent
          decorations={decorations}
          element={n}
          renderElement={renderElement}
          renderLeaf={renderLeaf}
          key={key.id}
        />
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