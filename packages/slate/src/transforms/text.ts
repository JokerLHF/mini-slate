import { Transforms } from ".";
import { Editor } from "../interfaces/editor";
import { Location } from '../interfaces/location';
import { Node, NodeEntry } from "../interfaces/node";
import { Path } from "../interfaces/path";
import { Point } from "../interfaces/point";
import { Range } from "../interfaces/range";

export interface TextDeleteOptions {
  reverse?: boolean;
  at?: Location;
}

export interface TextTransforms {
  insertText: (editor: Editor, text: string) => void;
  delete: (editor: Editor, options?: TextDeleteOptions) => void;
}

export interface TextInsertTextOptions {
  at?: Location
}

// eslint-disable-next-line no-redeclare
export const TextTransforms: TextTransforms = {
  insertText(
    editor: Editor,
    text: string,
    options: TextInsertTextOptions = {}
  ) {
    Editor.withoutNormalizing(editor, () => {
      let { at = editor.selection } = options;
      if (!at) {
        return;
      }
    
      // 1. at 是 path 的情况， 即选中整一个 textNode，转换为选中 path 下的 textNode 的 range。使用 range 的处理方式
      if (Path.isPath(at)) {
        at = Editor.range(editor, at)
      }
      // 2. at 是 range 的情况，需要考虑 range 是否重合
      if (Range.isRange(at)) {
        if (Range.isCollapsed(at)) {
          at = at.anchor
        } else {
          // TODO: 非重合的处理方式
        }
      }
      // 3. at 是 point 的情况，可以直接使用
  
      const { path, offset } = at;
      editor.apply({ type: 'insert_text', path, offset, text });
    });
  },

  delete(editor: Editor, options?: TextDeleteOptions) {
    Editor.withoutNormalizing(editor, () => {
      let { at = editor.selection } = options || {};
      if (Range.isRange(at) && Range.isCollapsed(at)) {
        at = at.anchor
      }

      // 如果是 point 处理成 range，下面都是统一成 range 的逻辑去处理
      if (Point.isPoint(at)) {
        const target = Editor.before(editor, at)!;
        at = { anchor: at, focus: target };
      }

      const range = Editor.range(editor, at!);
      const [start, end] = Range.edges(range);
      const isSingleText = Path.equals(start.path, end.path);

      const matches: NodeEntry[] = [];
      for (const nodeEntry of Node.nodes(editor, { from: start.path, to: end.path })) {
        const [_, path] = nodeEntry;
        // 跟 start end 同个祖先不处理，等到下面的 apply 逻辑去处理
        if (!Path.isCommon(path, start.path) && !Path.isCommon(path, end.path)) {
          matches.push(nodeEntry);
        }
      }
      const pathRefs = Array.from(matches, ([, p]) => Editor.pathRef(editor, p));

      const startRef = Editor.pointRef(editor, start);
      const endRef = Editor.pointRef(editor, end);
      // 开始节点
      if (!isSingleText) {
        const { path, offset } = startRef.current!;
        const node = Node.get(editor, path);
        const text = node.text.slice(offset);
        editor.apply({
          type: 'remove_text',
          path,
          offset,
          text,
        });
      }

      // 中间节点
      for (const pathRef of pathRefs) {
        const path = pathRef.unref()!;
        Transforms.removeNode(editor, { at: path });
      }

      // 尾部节点
      const { path, offset } = endRef.current!;
      const startOffset = isSingleText ? start.offset : 0;
      const node = Node.get(editor, path);
      const text = node.text.slice(startOffset, offset);
      editor.apply({
        type: 'remove_text',
        path,
        offset: startOffset,
        text,
      });
    });
  }
}
