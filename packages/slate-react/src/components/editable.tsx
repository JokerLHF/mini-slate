import React, { useCallback, useMemo, useRef } from 'react';
import { useChildren } from '../hooks/use-children';
import { useSlate } from '../hooks/use-slate';
import { Element, Text, Transforms, Range, NodeEntry } from 'slate';
import { useIsomorphicLayoutEffect } from '../hooks/use-isomorphic-layout-effect';
import { ReactEditor } from '../plugin/react-editor';
import { EDITOR_TO_ELEMENT, EDITOR_TO_WINDOW } from '../utils/weak-map';
import { DOMNode, DOMRange, getDefaultView, isDOMNode } from '../utils/dom';
import { debounce, throttle } from 'lodash';
import { DecorateContext } from '../hooks/use-decorate';

export interface RenderElementProps {
  children: any
  element: Element,
  attributes: {
    'data-slate-node': 'element',
    ref: (dom: HTMLElement | null) => void
  }
}

export interface RenderLeafProps {
  children: any
  text: Text,
  attributes: {
    'data-slate-leaf': true
  }
}


export const defaultDecorate: (entry: NodeEntry) => Range[] = () => []

export type EditableProps = {
  renderElement?: (props: RenderElementProps) => JSX.Element
  renderLeaf?: (props: RenderLeafProps) => JSX.Element
  decorate?: (entry: NodeEntry) => Range[]
};

const Children = (props: Parameters<typeof useChildren>[0]) => (
  <React.Fragment>{useChildren(props)}</React.Fragment>
);

export const Editable = (props: EditableProps) => {
  const {
    renderElement,
    renderLeaf,
    decorate = defaultDecorate,
  } = props;

  const Component = 'div';
  const editor = useSlate();
  const ref = useRef<HTMLDivElement>(null);

  const onDOMSelectionChange = useCallback(throttle(() => {
    const root = ReactEditor.findDocumentOrShadowRoot(editor);
    const domSelection = root.getSelection();
    
    // 没有 selection 取消 selection
    if (!domSelection) {
      return Transforms.deselect(editor)
    }

    const { anchorNode, focusNode } = domSelection;
    const anchorNodeSelectable = hasEditableTarget(editor, anchorNode);
    const focusNodeSelectable = hasEditableTarget(editor, focusNode);
    // 开始 & 结束节点都是 editor 中
    if (anchorNodeSelectable && focusNodeSelectable) {
      const range = ReactEditor.toSlateRange(editor, domSelection , { exactMatch: false, suppressThrow: true });
      
      if (range) {
        Transforms.select(editor, range)
      }
    }
  }, 10), []);

  const scheduleOnDOMSelectionChange = useMemo(
    () => debounce(onDOMSelectionChange, 0),
    [onDOMSelectionChange]
  )

  useIsomorphicLayoutEffect(() => {
    let window;
    if (ref.current && (window = getDefaultView(ref.current))) {
      EDITOR_TO_WINDOW.set(editor, window)
      EDITOR_TO_ELEMENT.set(editor, ref.current)
    }
    
    /**
     * TODO：目前没有 get 到这里的场景是什么。是不是：？？？？？？？
     * 应该不是通过用户调用API设置选区的时候，editor.selection 改变之后需要修改 view 层
     * 用户手动修改选区时 onDOMSelection 已经修改 view 层了，随后修改 editor.selection
     */
    const { selection } = editor;
    const root = ReactEditor.findDocumentOrShadowRoot(editor);
    const domSelection = root.getSelection();
    // selection 好像不会 return null 为什么 ts 会是 null
    if (!domSelection) {
      return;
    }

    // // 根据 editoe.selection 设置 domSelection
    const setDomSelection = () => {
      // https://developer.mozilla.org/zh-CN/docs/Web/API/Selection/type
      const hasDomSelection = domSelection.type !== 'None'

      // If the DOM selection is properly unset, we're done.
      if (!selection && !hasDomSelection) {
        return
      }
      // 根据 slateSelection 创建新的 DomRange
      const newDomRange: DOMRange | null = selection && ReactEditor.toDOMRange(editor, selection);
      // 设置新的 DomRange 到 domSelection. 由于浏览器限制只能创建正向 selection，所以这里需要做一下判断处理
      if (newDomRange) {
        if (Range.isBackward(selection!)) {
          domSelection.setBaseAndExtent(
            newDomRange.endContainer,
            newDomRange.endOffset,
            newDomRange.startContainer,
            newDomRange.startOffset
          )
        } else {
          domSelection.setBaseAndExtent(
            newDomRange.startContainer,
            newDomRange.startOffset,
            newDomRange.endContainer,
            newDomRange.endOffset
          )
        }
      } else {
        domSelection.removeAllRanges()
      }

      return newDomRange
    }
    
    setDomSelection();
  });

  useIsomorphicLayoutEffect(() => {
    const window = ReactEditor.getWindow(editor);

    window.document.addEventListener(
      'selectionchange',
      scheduleOnDOMSelectionChange
    )

    return () => {
      window.document.removeEventListener(
        'selectionchange',
        scheduleOnDOMSelectionChange
      )
    }
  });

  return (
    <DecorateContext.Provider value={decorate}>
      <Component
        ref={ref}
        contentEditable={true}
        suppressContentEditableWarning // 给标签设置可编辑的属性contentEditable，页面会弹出警告，这个属性去除
        data-slate-editor
      >
        <Children
          node={editor} 
          renderElement={renderElement}
          renderLeaf={renderLeaf}
        />
      </Component>
    </DecorateContext.Provider>
  )
}

export const hasEditableTarget = (
  editor: ReactEditor,
  target: EventTarget | null
): target is DOMNode => {
  return isDOMNode(target) && ReactEditor.hasDOMNode(editor, target);
}