import React, { useCallback, useEffect }  from "react"
import { Descendant } from "slate"
import { SlateContext, SlateContextValue } from "../hooks/use-slate"
import { ReactEditor } from "../plugin/react-editor"
import { EDITOR_TO_ON_CHANGE } from "../utils/weak-map"

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

  return (
    <SlateContext.Provider value={context}>
      {children}
    </SlateContext.Provider>
  );
}