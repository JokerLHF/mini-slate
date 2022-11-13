import React, { useRef } from "react";
import { Element, Text as SlateText, Range } from 'slate'
import { useIsomorphicLayoutEffect } from "../hooks/use-isomorphic-layout-effect";
import { useSlate } from "../hooks/use-slate";
import { ReactEditor } from "../plugin/react-editor";
import { EDITOR_TO_KEY_TO_ELEMENT, ELEMENT_TO_NODE } from "../utils/weak-map";
import { RenderLeafProps } from "./editable";
import Leaf from './leaf';

const Text = (props: {
  renderLeaf?: (props: RenderLeafProps) => JSX.Element
  text: SlateText,
  parent: Element,
  decorations: Range[],
}) => {
  const editor = useSlate();
  const ref = useRef<HTMLSpanElement>(null);

  const { text, renderLeaf, parent, decorations } = props;
  const children: JSX.Element[] = [];
  const key = ReactEditor.findKey(editor, text);

  useIsomorphicLayoutEffect(() => {
    const KEY_TO_ELEMENT = EDITOR_TO_KEY_TO_ELEMENT.get(editor)
    if (ref.current) {
      KEY_TO_ELEMENT?.set(key, ref.current);
      ELEMENT_TO_NODE.set(ref.current, text);
    }
  });

  const leaves = SlateText.decorations(text, decorations)  
  for (let i = 0; i < leaves.length; i++) {
    const leaf = leaves[i]

    children.push(
      <Leaf 
        text={text}
        leaf={leaf}
        parent={parent}
        renderLeaf={renderLeaf}
        key={`${key.id}-${i}`}
      />
    )
  }

  return (
    <span data-slate-node="text" ref={ref}>
      {children}
    </span>
  );
};

const MemoizedText = React.memo(Text);

export default MemoizedText;