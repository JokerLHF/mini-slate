import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { useChildren } from '../hooks/use-children';
import { useSlate } from '../hooks/use-slate';
import { Element, Text, Transforms, Range, NodeEntry, Editor } from 'slate';
import { useIsomorphicLayoutEffect } from '../hooks/use-isomorphic-layout-effect';
import { ReactEditor } from '../plugin/react-editor';
import { EDITOR_TO_ELEMENT, EDITOR_TO_WINDOW, IS_COMPOSING } from '../utils/weak-map';
import { DOMNode, DOMRange, getDefaultView, isDOMNode } from '../utils/dom';
import { debounce, throttle } from 'lodash';

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
  leaf: Text,
  attributes: {
    'data-slate-leaf': true
  }
}

type DeferredOperation = () => void;

export type EditableProps = {
  renderElement?: (props: RenderElementProps) => JSX.Element
  renderLeaf?: (props: RenderLeafProps) => JSX.Element
  decorate?: (entry: NodeEntry) => Range[]
};

const Children = (props: Parameters<typeof useChildren>[0]) => {
  const children = useChildren(props);  
  return <React.Fragment>{children}</React.Fragment>
};

export const Editable = (props: EditableProps) => {
  const {
    renderElement,
    renderLeaf,
  } = props;

  const Component = 'div';
  const editor = useSlate();
  const ref = useRef<HTMLDivElement>(null);
  const deferredOperations = useRef<DeferredOperation[]>([]);
  const decorations = [];

  const onDOMSelectionChange = useCallback(throttle(() => {
    // 中文环境不处理 selection, 等 compositionEnd 之后再出来    
    if (ReactEditor.isComposing(editor)) {
      return;
    }

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
  }, 10), [editor]);

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
     * onSelectionChange 的时候修改 model 层，model 层的 selection 变化引起 re-render，
     * 这里需要在 re-render 的时候根据 model 的 selection 渲染 view 的 selection
     */
    const { selection } = editor;
    const root = ReactEditor.findDocumentOrShadowRoot(editor);
    const domSelection = root.getSelection();
    if (!domSelection) {
      return;
    }

    // 根据 editoe.selection 设置 domSelection
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

  const onBeforeInput = useCallback((event: InputEvent) => {
    // 中文环境交给浏览器渲染    
    if (ReactEditor.isComposing(editor)) {
      return;
    }

    const { inputType, data } = event;
    let isNative = false;

    // const { selection } = editor;
    // TODO: 还不是很理解为什么这里对于单字符的插入要使用 浏览器接管渲染
    // if (
    //   inputType === 'insertText' &&
    //   data &&
    //   data.length === 1 &&
    //   /[a-z ]/i.test(data) &&  // TODO：为什么做着限制
    //   selection &&
    //   Range.isCollapsed(selection)
    // ) {
    //   isNative = true;
    // }

    if (!isNative) {
      event.preventDefault();
    }

    console.log('onBeforeInput', event);
    switch (inputType) {
      case 'insertText':
        if (typeof data === 'string') {
          if (isNative) {
            deferredOperations.current.push(() =>
              Editor.insertText(editor, data)
            )
          } else {
            Editor.insertText(editor, data)
          }
        }
      default:
        break;
    }
  }, [editor]);

  useIsomorphicLayoutEffect(() => {    
    ref.current?.addEventListener('beforeinput', onBeforeInput);
    return () => ref.current?.removeEventListener('beforeinput', onBeforeInput);
  }, [onBeforeInput]);
  
  // decoration 表示哪一个 range 需要标记为 mark
  const { selection, marks } = editor;
  if (selection && marks && Range.isCollapsed(selection)) {
    const { anchor } = selection;
    decorations.push({
      anchor,
      focus: anchor,
      ...marks,
    })
  }
  
  return (
    <Component
      ref={ref}
      contentEditable={true}
      suppressContentEditableWarning // 给标签设置可编辑的属性contentEditable，页面会弹出警告，这个属性去除
      data-slate-editor
      style={{
        padding: 20,
        border: '1px black solid',
        // react 渲染多个空格的时候，默认只会渲染成一个空格，这个属性允许渲染多个
        whiteSpace: 'pre-wrap',
      }}
      onInput={useCallback((event: React.SyntheticEvent) => {          
        for (const op of deferredOperations.current) {
          op();
        }
        deferredOperations.current = []
      }, [])}
      onCompositionUpdate={useCallback((event: React.CompositionEvent<HTMLDivElement>) => {
        IS_COMPOSING.set(editor, true);
      }, [editor])}
      onCompositionEnd={useCallback((event: React.CompositionEvent<HTMLDivElement>) => {
        IS_COMPOSING.set(editor, false);
        Editor.insertText(editor, event.data);
      }, [editor])}
    >
      <Children
        node={editor} 
        renderElement={renderElement}
        renderLeaf={renderLeaf}
        decorations={decorations}
      />
    </Component>
  )
}

export const hasEditableTarget = (
  editor: ReactEditor,
  target: EventTarget | null
): target is DOMNode => {
  return isDOMNode(target) && ReactEditor.hasDOMNode(editor, target);
}

/**
 * oninput 只有在浏览器接管渲染的时候才会执行，
 * onComposition 只有在中文环境下才执行
 * 执行顺序 onCompositionStart => beforeinput => onCompositionUpdate => oninput => selectionChange
 */