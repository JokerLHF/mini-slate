import React, { memo, useCallback, } from "react";
import { Element as SlateElement, Range } from 'slate'
import { useChildren } from "../hooks/use-children";
import { useSlate } from "../hooks/use-slate";
import { ReactEditor } from "../plugin/react-editor";
import { EDITOR_TO_KEY_TO_ELEMENT, ELEMENT_TO_NODE } from "../utils/weak-map";
import { RenderElementProps, RenderLeafProps } from "./editable";

export const DefaultElement = (props: RenderElementProps) => {
  const { attributes, children, element } = props;
  const editor = useSlate();
  const Tag = editor.isInline(element) ? 'span' : 'div';
  return (
    <Tag {...attributes} style={{ position: 'relative' }}>
      {children}
    </Tag>
  )
}

const Element = (props: {
  element: SlateElement,
  renderElement?: (props: RenderElementProps) => JSX.Element,
  renderLeaf?: (props: RenderLeafProps) => JSX.Element,
  decorations: Range[],
  selection: Range | null
}) => {
  const editor = useSlate();
  const {
    element,
    renderElement = (p: RenderElementProps) => <DefaultElement {...p} />,
    renderLeaf,
    decorations,
    selection,
  } = props;

  const key = ReactEditor.findKey(editor, element);
  const isInline = editor.isInline(element);

  const refCb = useCallback((ref: HTMLElement | null) => {
    const KEY_TO_ELEMENT = EDITOR_TO_KEY_TO_ELEMENT.get(editor)
    if (ref) {
      KEY_TO_ELEMENT?.set(key, ref);
      ELEMENT_TO_NODE.set(ref, element);
    }
  }, []);

  const attributes: {
    'data-slate-node': 'element',
    'data-slate-void'?: true,
    ref: (dom: HTMLElement | null) => void
  } = {
    'data-slate-node': 'element',
    ref: refCb
  }


  if (isInline) {
    attributes['data-slate-inline'] = true
  }
  
  let children: React.ReactNode = useChildren({ node: element, renderElement, renderLeaf, decorations, selection })
  
  return renderElement({ attributes, element, children });
};

const MemoizedElement = memo(Element, (prev, next) => {
  const res = (
    prev.element === next.element &&
    prev.renderElement === next.renderElement &&
    prev.renderLeaf === next.renderLeaf &&
    prev.decorations === next.decorations
  );
  return res;
});

export default MemoizedElement;