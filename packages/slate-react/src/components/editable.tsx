import React, { useCallback, useMemo, useRef } from 'react';
import { useChildren } from '../hooks/use-children';
import { useSlate } from '../hooks/use-slate';
import { Element, Text, Transforms, Range, NodeEntry, Editor } from 'slate';
import { useIsomorphicLayoutEffect } from '../hooks/use-isomorphic-layout-effect';
import { ReactEditor } from '../plugin/react-editor';
import { EDITOR_TO_ELEMENT, EDITOR_TO_WINDOW, IS_COMPOSING, IS_FOCUSED } from '../utils/weak-map';
import { DOMNode, DOMRange, getDefaultView, isDOMNode } from '../utils/dom';
import { debounce, throttle } from 'lodash';
import HOT_KEYS from '../utils/hotkeys';

export interface RenderElementProps {
  children: any;
  element: Element;
  attributes: {
    'data-slate-node': 'element',
    ref: (dom: HTMLElement | null) => void
  }
}

export interface RenderLeafProps {
  children: any;
  leaf: Text;
  attributes: {
    'data-slate-leaf': true
  }
}

export type EditableProps = {
  renderElement?: (props: RenderElementProps) => JSX.Element;
  renderLeaf?: (props: RenderLeafProps) => JSX.Element;
  decorate?: (entry: NodeEntry) => Range[];
  onKeyDown?: (event: React.KeyboardEvent<HTMLDivElement>) => void;
};

const Children = (props: Parameters<typeof useChildren>[0]) => {
  const children = useChildren(props);  
  return <React.Fragment>{children}</React.Fragment>
};

export const Editable = (props: EditableProps) => {
  const {
    renderElement,
    renderLeaf,
    onKeyDown,
  } = props;

  const Component = 'div';
  const editor = useSlate();
  const ref = useRef<HTMLDivElement>(null);
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

    if (selection && !ReactEditor.hasRange(editor, selection)) {
      editor.selection = ReactEditor.toSlateRange(editor, domSelection, {
        exactMatch: false,
        suppressThrow: true,
      })        
      return
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
  }, [scheduleOnDOMSelectionChange]);

  const onBeforeInput = useCallback((event: InputEvent) => {
    // 中文环境交给浏览器渲染    
    if (ReactEditor.isComposing(editor)) {
      return;
    }

    const { inputType, data, dataTransfer } = event;
    event.preventDefault();

    const { selection } = editor;
    // 多选的删除
    if (
      selection &&
      !Range.isCollapsed(selection) &&
      event.inputType.startsWith('delete')
    ) {
      Editor.deleteFragment(editor);
      return;
    }

    switch (inputType) {
      case 'insertText':
      case 'insertFromPaste': { // command+v
        if (dataTransfer?.constructor.name === 'DataTransfer') {
          ReactEditor.insertFragmentData(editor, dataTransfer);
        } else if (typeof data === 'string') {
          Editor.insertText(editor, data);
        }
        break;
      }
      case 'deleteContentBackward': { // 单选删除
        Editor.deleteBackward(editor);
        break;
      }
      case 'insertParagraph': { // 换行
        Editor.insertBreak(editor);
        break;
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
      onCompositionUpdate={useCallback((event: React.CompositionEvent<HTMLDivElement>) => {
        IS_COMPOSING.set(editor, true);
      }, [editor])}
      onCompositionEnd={useCallback((event: React.CompositionEvent<HTMLDivElement>) => {
        IS_COMPOSING.set(editor, false);
        Editor.insertText(editor, event.data);
      }, [editor])}
      onKeyDown={useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
        if (onKeyDown) {
          onKeyDown?.(event);
          return;
        }
        const { nativeEvent } = event;
        if (HOT_KEYS.isRedo(nativeEvent)) {
          console.log('HOT_KEYS-isRedo');
          (editor as any).redo && (editor as any).redo();
          return;
        }
        if (HOT_KEYS.isUndo(nativeEvent)) {
          console.log('HOT_KEYS-isUndo');
          (editor as any).undo && (editor as any).undo();
          return;
        }
      }, [onKeyDown])}
      onCopy={useCallback((event: React.ClipboardEvent<HTMLDivElement>) => { // command+c
        event.preventDefault();
        ReactEditor.setFragmentData(editor, event.clipboardData);
      }, [])}
      onFocus={useCallback(() => {
        IS_FOCUSED.set(editor, true);
      }, [])}
      onBlur={useCallback(() => {
        IS_FOCUSED.set(editor, false);
      }, [])}
    >
      <Children
        node={editor} 
        renderElement={renderElement}
        renderLeaf={renderLeaf}
        decorations={decorations}
        selection={selection}
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