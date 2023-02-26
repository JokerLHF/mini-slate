import { Transforms } from ".";
import { Editor } from "../interfaces/editor";
import { Location } from '../interfaces/location';
import { Point } from "../interfaces/point";
import { Range } from '../interfaces/range';
import { SelectionEdge } from "../interfaces/types";

export interface SelectionMoveOptions {
  reverse?: boolean;
  edge?: SelectionEdge;
  distance?: number;
}

export interface SelectionCollapseOptions {
  edge?: SelectionEdge
}

export interface SelectionTransforms {
  select: (editor: Editor, target: Location) => void;
  deselect: (editor: Editor) => void;
  setSelection: (editor: Editor, props: Partial<Range>) => void;
  move: (editor: Editor, options?: SelectionMoveOptions) => void;
  collapse: (editor: Editor, options?: SelectionCollapseOptions) => void;
}

// eslint-disable-next-line no-redeclare
export const SelectionTransforms: SelectionTransforms = {
    /**
   * Collapse the selection.
   */

  collapse(editor: Editor, options: SelectionCollapseOptions = {}): void {
    const { edge = 'anchor' } = options;
    const { selection } = editor;

    if (!selection) {
      return
    }
    
    if (edge === 'anchor') {
      Transforms.select(editor, selection.anchor)
    } else if (edge === 'focus') {
      Transforms.select(editor, selection.focus)
    } else if (edge === 'start') {
      const [start] = Range.edges(selection)
      Transforms.select(editor, start)
    } else if (edge === 'end') {
      const [, end] = Range.edges(selection)
      Transforms.select(editor, end)
    }
  },
  /**
   *  选区是正的: [anchor, focus]
   *  选区是反的: [focus, anchor]
   * start 表示如果选区是正的，就把 anchor 移动，如果选区是反的，就把 focus 移动的
   * end 同上
   * anchor: 就直接移动 anchor，
   * focus: 就直接移动 focus
   * 
   * reverse 是否往前，默认是往后。移动 distance 位置
   */
  move(editor: Editor, options: SelectionMoveOptions = {}) {
    const { selection } = editor;
    const { distance = 1, reverse = false } = options
    let { edge = null } = options

    if (!selection) {
      return;
    }

    const props: Partial<Range> = {};

    if (edge === 'start') {
      edge = Range.isBackward(selection) ? 'focus' : 'anchor'
    }

    if (edge === 'end') {
      edge = Range.isBackward(selection) ? 'anchor' : 'focus'
    }

    const { anchor, focus } = selection;
    if (edge === null || edge === 'anchor') {
      const point = reverse 
        ? Editor.before(editor, anchor, { distance })
        : Editor.after(editor, anchor, { distance });

      if (point) {
        props.anchor = point;
      }
    }

    if (edge === null || edge === 'focus') {
      const point = reverse
        ? Editor.before(editor, focus, { distance })
        : Editor.after(editor, focus, { distance });

      if (point) {
        props.focus = point;
      }
    }

    Transforms.setSelection(editor, props);
  },
  /**
   * 为 editor 设置 selection，
   */
  select(editor: Editor, target: Location) {
    const { selection } = editor;
    const targetRange = Editor.range(editor, target);
    // 存在 selection 直接设置
    if (selection) {
      Transforms.setSelection(editor, targetRange);
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
      if (props[key] !== null && !Point.equals(selection[key], props[key])) {
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
