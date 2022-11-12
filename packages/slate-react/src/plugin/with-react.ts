import ReactDOM from "react-dom";
import { BaseEditor, Operation } from "slate";
import { EDITOR_TO_KEY_TO_ELEMENT, EDITOR_TO_ON_CHANGE } from "../utils/weak-map";
import { ReactEditor } from "./react-editor";

export const withReact = <T extends BaseEditor>(editor: T): T & ReactEditor=> {
  const e = editor as T & ReactEditor;
  const { apply, onChange } = e

  EDITOR_TO_KEY_TO_ELEMENT.set(e, new WeakMap());

  e.onChange = () => {
    ReactDOM.unstable_batchedUpdates(() => {
      const onContextChange = EDITOR_TO_ON_CHANGE.get(e);
      
      if (onContextChange) {
        onContextChange()
      }
      // 调用 slate 本身的 onChange
      onChange();
    });
  }

  e.apply = (op: Operation) => {
    console.log('react-editor-apply');
    apply(op)
  }
  return e;
}