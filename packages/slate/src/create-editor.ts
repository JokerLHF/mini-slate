import { Editor } from "./interfaces/editor";
import { Operation } from "./interfaces/operation";
import { Transforms } from "./transforms";

export const createEditor = (): Editor => {
  const editor: Editor = {
    children: [],
    selection: null,
    operations: [],
    onChange: () => {},
    isInline: () => false,
    isVoid: () => false,

    apply: (op: Operation) => {
      editor.operations.push(op);
      Transforms.transform(editor, op);

      editor.onChange();
      editor.operations = [];
    },
  }

  return editor;
}
