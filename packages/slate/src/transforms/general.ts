import { Editor, Selection } from "../interfaces/editor"
import { Operation } from "../interfaces/operation"
import { createDraft, finishDraft, isDraft } from 'immer'
import { Range } from '../interfaces/range';
import { Node } from '../interfaces/node';
import { Text } from "../interfaces/text";
import { Point } from "../interfaces/point";

export interface GeneralTransforms {
  transform: (editor: Editor, op: Operation) => void
}

const applyToDraft = (editor: Editor, selection: Selection, op: Operation): Selection => {
  switch (op.type) {
    case 'set_selection': {
      const { newProperties } = op;
      /**
       * 情况1: 存在 selection 时候 取消 selection
       * 情况2: 不存在 selection 时候设置新的 selection
       * 情况3: 存在 selection 设置新的 selection
       */
      if (newProperties === null) {
        selection = null;
        break;
      }

      if (selection === null) {
        if (!Range.isRange(newProperties)) {
          throw new Error('Cannot apply an incomplete "set_selection" operation properties');
        }
        selection = { ...newProperties };
        break;
      }
  
      for (const key in newProperties) {
        const value = newProperties[key]

        if (value == null) {
          throw new Error(`Cannot remove the "${key}" selection property`)
        } else {
          selection[key] = value
        }
      }
      break;
    }

    case 'insert_text': {
      const { path, offset, text } = op;
      const node = Node.get(editor, path) as Text;
      const before = node.text.slice(0, offset);
      const after = node.text.slice(offset);
      node.text = before + text + after;

      if (selection) {
        const { anchor, focus } = selection;
        selection.anchor = Point.transform(anchor, op)!;
        selection.focus = Point.transform(focus, op)!;
      }
      break;
    }
  }
  return selection;
}

export const GeneralTransforms: GeneralTransforms = {
  /**
   * Transform the editor by an operation.
   */

  transform(editor: Editor, op: Operation): void {
    editor.children = createDraft(editor.children);
    let selection = editor.selection && createDraft(editor.selection);
    try {
      selection = applyToDraft(editor, selection, op);
    } finally {
      editor.children = finishDraft(editor.children);
      editor.selection = isDraft(selection) ? finishDraft(selection) : selection;
    }
  },
}
