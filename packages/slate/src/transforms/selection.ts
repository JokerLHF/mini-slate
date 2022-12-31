import { Transforms } from ".";
import { Editor } from "../interfaces/editor";
import { Location } from '../interfaces/location';
import { Point } from "../interfaces/point";
import { Range } from '../interfaces/range';

export interface SelectionTransforms {
  select: (editor: Editor, target: Location) => void,
  deselect: (editor: Editor) => void,
  setSelection: (editor: Editor, props: Partial<Range>) => void
}

// eslint-disable-next-line no-redeclare
export const SelectionTransforms: SelectionTransforms = {
  /**
   * 为 editor 设置 selection，
   */
  select(editor: Editor, target: Location) {
    const { selection } = editor;
    const targetRange = Editor.range(editor, target);
    // 存在 selection 直接设置
    if (selection) {
      Transforms.setSelection(editor, targetRange)
      return;
    }

    // 不存在直接 apply
    editor.apply({
      type: 'set_selection',
      properties: null,
      newProperties: targetRange,
    })
  },
  /**
   * 为 editor 设置空的 selection
   */
  deselect(editor: Editor) {
    const { selection } = editor;
    if (selection) {
      editor.apply({
        type: 'set_selection',
        properties: selection,
        newProperties: null,
      });
    }
  },
  /**
   * 对比得出新旧 selection 的差异点，应用差异点
   */
  setSelection(editor: Editor, props: Partial<Range>) {
    const { selection } = editor;
    const oldProps: Partial<Range> | null = {}
    const newProps: Partial<Range> = {}

    if (!selection) {
      return;
    }

    for (const key in props) {
      // 记录不相等的
      if (key !== null && !Point.equals(selection[key], props[key])) {
        oldProps[key] = selection[key];
        newProps[key] = props[key];
      }
    }

    if (Object.keys(newProps).length) {
      editor.apply({
        type: 'set_selection',
        properties: oldProps,
        newProperties: newProps,
      })
    }
  },
}
