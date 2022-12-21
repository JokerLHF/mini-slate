import { Transforms } from ".";
import { Editor } from "../interfaces/editor";
import { Node } from '../interfaces/node';
import { Point } from "../interfaces/point";
import { Range } from "../interfaces/range";

export interface NodeTransforms {
  insertNode: (editor: Editor, node: Node) => void;
  splitNodes: (editor: Editor, options: { at: Point }) => void;
  setNode: (editor: Editor, props: Partial<Node>) => void;
}

// eslint-disable-next-line no-redeclare
export const NodeTransforms: NodeTransforms = {
  splitNodes: (editor: Editor, options: { at: Point }) => {
    const { at } = options;
    // 处于节点最左边或者最右边不处理
    if (Editor.isEdge(editor, at, at.path)) {
      return;
    }
    editor.apply({
      type: 'split_node',
      position: at.offset,
      path: at.path,
    });
  },

  insertNode: (editor: Editor, node: Node) => {
    const { selection } = editor;
    // 只处理光标闭合的情况
    if (Range.isRange(selection) && Range.isCollapsed(selection)) {
      const at = selection.anchor;
      // 1. 先将 node 按照 at 位置分割
      Transforms.splitNodes(editor, { at });
      // 2. 将 node 插入到 at 的位置
      editor.apply({
        type: 'insert_node',
        node,
        path: at.path,
      });
    }
  },

  setNode: (editor: Editor, props: Partial<Node>) => {
    const { selection } = editor;

    // 只处理光标扩展的情况
    if (Range.isRange(selection) && !Range.isCollapsed(selection)) {
      // 1. 先对节点进行分割
      const rangeRef = Editor.rangeRef(editor, selection, { affinity: 'inward' });
      /**
       * 从后到前分割好处：end 拆分为多个 node 对于 start 的 path 无影响
       * 从前到后：start 拆分为多个 node 对于 end 的 path 会有影响
       */
      const [start, end] = Range.edges(selection);
      Transforms.splitNodes(editor, { at: end });
      Transforms.splitNodes(editor, { at: start });
      const at = rangeRef.unref();
      // 2. 对选区的节点增加 mark
      
      for (const [textNode, textNodePath] of Node.texts(editor, { from: at?.anchor.path, to: at?.focus.path })) {
        let hasChanges = false;
        for (const k in props) {
          if (k === 'children' || k === 'text') {
            continue
          }

          if (props[k] !== textNode[k]) {
            hasChanges = true;
            break;
          }
        }

        if (hasChanges) {
          editor.apply({
            type: 'set_node',
            newProperties: props,
            path: textNodePath,
          })
        }
      }
      
    }
  }
}
