import { Editor, Selection } from "../interfaces/editor"
import { Operation } from "../interfaces/operation"
import { createDraft, finishDraft, isDraft } from 'immer'
import { Range } from '../interfaces/range';
import { Node } from '../interfaces/node';
import { Text } from "../interfaces/text";
import { Point } from "../interfaces/point";
import { Path } from "../interfaces/path";

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

    case 'split_node': {
      const { path, position } = op;
      const node = Node.get(editor, path);
      const parent = Node.parent(editor, path);
      const index = path[path.length - 1];

      if (Text.isText(node)) {
        const before = node.text.slice(0, position);
        const after = node.text.slice(position);
        // 修改现有 node text
        node.text = before;
        // 在现有 node 后面插入新的 textNode
        const newNode: Text = {
          text: after
        }
        parent.children.splice(index + 1, 0, newNode);
      }

      // splitNode 的 selection 会指向分割出来的那一个开头
      if (selection) {
        const { anchor, focus } = selection;
        selection.anchor = Point.transform(anchor, op)!;
        selection.focus = Point.transform(focus, op)!;
      }
      break;
    }

    case 'insert_node': {
      const { path, node } = op;
      const parent = Node.parent(editor, path);
      const index = path[path.length - 1];
      parent.children.splice(index, 0, node);
              
      // selection 指向 insertNode 的尾巴
      if (selection) {
        const { anchor, focus } = selection;
        selection.anchor = Point.transform(anchor, op)!;
        selection.focus = Point.transform(focus, op)!;
      }
      break;
    }

    case 'set_node': {
      const { path, newProperties } = op;
      const node = Node.get(editor, path);

      for (const key in newProperties) {
        const value = newProperties[key]
        if (value === null) {
          delete node[key];
        } else {
          node[key] = value;
        }
      }
      break;
    }
    case 'remove_node': {
      const { path } = op;
      const parent = Node.parent(editor, path);
      const index = path[path.length - 1];
      parent.children.splice(index, 1);
      // 这里把 node 删除之后还需要重新设置 selection
      if (selection) {
        // TODO
      }
      break;
    }
    case 'merge_node': {
      const { path } = op;
      const parent = Node.parent(editor, path);
      const index = path[path.length - 1];

      const currentNode = Node.get(editor, path);
      const prevPath = Path.previous(path);
      const prevNode = Node.get(editor, prevPath);

      if (Text.isText(prevNode) && Text.isText(currentNode)) {
        // 两个 text 合并，text 合并到前一个，并且删掉当前 textNode
        prevNode.text += currentNode.text;
        parent.children.splice(index, 1);
      }

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
