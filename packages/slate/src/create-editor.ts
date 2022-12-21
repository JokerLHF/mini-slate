import { Editor } from "./interfaces/editor";
import { Operation } from "./interfaces/operation";
import { PathRef } from "./interfaces/path-ref";
import { PointRef } from "./interfaces/point-ref";
import { Range } from "./interfaces/range";
import { RangeRef } from "./interfaces/range-ref";
import { Transforms } from "./transforms";

export const createEditor = (): Editor => {
  const editor: Editor = {
    children: [],
    selection: null,
    operations: [],
    onChange: () => {},
    isInline: () => false,
    marks: null,

    insertText: (text: string) => {
      const { selection, marks } = editor;
      if (!selection) {
        return;
      }

      if (marks) {
        const node = { text, ...marks }
        Transforms.insertNode(editor, node)
      } else {
        Transforms.insertText(editor, text);
      }

      editor.marks = null;
    },

    addMark: (key: string, value: any) => {
      const selection = editor.selection;
      if (!selection) {
        return;
      }
      // 在某一处光标，直接设置全局 marks. 渲染层根据 mark 切为多个 decoration 做渲染
      if (Range.isCollapsed(selection)) {
        editor.marks = { [key]: value };
        editor.onChange();
      } else {
        Transforms.setNode(editor, { [key]: value });
      }
    },

    apply: (op: Operation) => {
      for (const pointRef of Editor.pointRefs(editor)) {        
        PointRef.transform(pointRef, op);
      }

      for (const rangeRef of Editor.rangeRefs(editor)) {        
        RangeRef.transform(rangeRef, op);
      }

      for (const pathRef of Editor.pathRefs(editor)) {        
        PathRef.transform(pathRef, op);
      }

      editor.operations.push(op);
      Transforms.transform(editor, op);

      // 失焦的时候取消 marks
      if (op.type === 'set_selection') {
        editor.marks = null;
      }

      editor.onChange();
      editor.operations = [];
    },
  }

  return editor;
}
