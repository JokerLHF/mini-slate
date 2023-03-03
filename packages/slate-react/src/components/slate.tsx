import React, { useCallback, useEffect, useState }  from "react"
import { Descendant } from "slate"
import { FocusedContext } from "../hooks/use-focused"
import { useIsomorphicLayoutEffect } from "../hooks/use-isomorphic-layout-effect"
import { SlateContext, SlateContextValue } from "../hooks/use-slate"
import { ReactEditor } from "../plugin/react-editor"
import { EDITOR_TO_ON_CHANGE } from "../utils/weak-map"
import { EditorContext } from '../hooks/use-slate-static';

export const Slate = (props: {
  editor: ReactEditor
  value: Descendant[]
  children: React.ReactNode
  onChange?: (value: Descendant[]) => void
}) => {
  const { editor, children, onChange, value } = props;
  const [context, setContext] = React.useState<SlateContextValue>(() => {
    editor.children = value;
    return { v: 0, editor };
  })

  const onContextChange = useCallback(() => {
    setContext(prev => ({
      v: prev.v + 1,
      editor,
    }));
    onChange?.(editor.children);
  }, []);

  useEffect(() => {
    EDITOR_TO_ON_CHANGE.set(editor, onContextChange);
    return () => {
      EDITOR_TO_ON_CHANGE.set(editor, () => {});
    }
  }, []);

  const [isFocus, setIsFocused] = useState(ReactEditor.isFocused(editor));

  useEffect(() => {
    setIsFocused(ReactEditor.isFocused(editor));
  });

  useIsomorphicLayoutEffect(() => {
    const fn = () => {
      setIsFocused(ReactEditor.isFocused(editor))
    }
    // Editable 的 onFocus 先执行后触发这里
    document.addEventListener('focusin', fn)
    document.addEventListener('focusout', fn)
    return () => {
      document.removeEventListener('focusin', fn)
      document.removeEventListener('focusout', fn)
    }
  }, []);

  return (
    <SlateContext.Provider value={context}>
      <EditorContext.Provider value={context.editor}>
        <FocusedContext.Provider value={isFocus}>
          {children}
        </FocusedContext.Provider>
      </EditorContext.Provider>
    </SlateContext.Provider>
  );
}