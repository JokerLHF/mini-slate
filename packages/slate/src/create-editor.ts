import { Editor } from "./interfaces/editor";
import { Element } from "./interfaces/element";
import { Descendant, Node, NodeEntry } from "./interfaces/node";
import { Operation } from "./interfaces/operation";
import { Path } from "./interfaces/path";
import { PathRef } from "./interfaces/path-ref";
import { PointRef } from "./interfaces/point-ref";
import { Range } from "./interfaces/range";
import { RangeRef } from "./interfaces/range-ref";
import { Text } from "./interfaces/text";
import { Transforms } from "./transforms";
import { DIRTY_PATHS, DIRTY_PATHS_KEYS } from "./utils/weak-maps";

export const createEditor = (): Editor => {
  const editor: Editor = {
    children: [],
    selection: null,
    operations: [],
    onChange: () => {},
    isInline: () => false,
    marks: null,

    insertBreak: () => {
      Transforms.splitNodes(editor, { always: true })
    },

    insertText: (text: string) => {
      const { selection, marks } = editor;
      if (!selection) {
        return;
      }

      if (marks) {
        const node = { text, ...marks };
        Transforms.insertNodes(editor, node);
      } else {
        Transforms.insertText(editor, text);
      }

      editor.marks = null;
    },

    deleteBackward() {
      const { selection } = editor;
      if (selection && Range.isCollapsed(selection)) {
        Transforms.delete(editor);
      }
    },

    deleteFragment() {
      const { selection } = editor;
      if (selection && !Range.isCollapsed(selection)) {
        Transforms.delete(editor);
      }
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
        Transforms.setNodes(editor, { [key]: value });
      }
    },

    removeMark: (key: string) => {
      const selection = editor.selection;
      if (!selection) {
        return;
      }
      // 在某一处光标，直接设置全局 marks. 渲染层根据 mark 切为多个 decoration 做渲染
      if (Range.isCollapsed(selection)) {
        const marks = editor.marks || {};
        delete marks[key];
        editor.marks = marks;
        editor.onChange();
      } else {
        Transforms.setNodes(editor, { [key]: null });
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

      const dirtyPaths: Path[] = [];
      const dirtyPathKeys: Set<string> = new Set();

      const add = (path: Path | null) => {
        if (!path) {
          return;
        }
        const key = path.join(',');
        if (!dirtyPathKeys.has(key)) {
          dirtyPathKeys.add(key);
          dirtyPaths.push(path);
        }
      }

      const oldDirtyPath = DIRTY_PATHS.get(editor) || [];
      for (const oldPath of oldDirtyPath) {
         /**
         * 对于前几次 apply 产生的 path，需要重新 transform。因为当前 op 可能会对之前的 path 产生影响
         * 比如 [111，222] 2个节点， 选择12进行加粗，此时的path是[11,1,2,22] dirtyPath(split_node)是 [1,2,22]
         * 因为[1,2] 可以合并为一个，所以合并之后 dirtyPath [22] 的 path 需要重新计算一遍
         */
        const newPath = Path.transform(oldPath, op);
        add(newPath);
      }

      const newDirtyPaths = editor.getDirtyPaths(op)
      for (const path of newDirtyPaths) {
        add(path)
      }

      editor.operations.push(op);
      DIRTY_PATHS.set(editor, dirtyPaths)
      DIRTY_PATHS_KEYS.set(editor, dirtyPathKeys)

      Transforms.transform(editor, op);

      // 失焦的时候取消 marks
      if (op.type === 'set_selection') {
        editor.marks = null;
      }

      // 多次 apply 可以合并为一次 onchange，使用 promise
      Promise.resolve().then(() => {
        editor.onChange();
        editor.operations = [];
      });
    },

    /**
     * 什么才能算脏路径？
     * 可以想象文档是一个immer，对于某一处的修改会影响到的路径就是脏路径
     * https://ithelp.ithome.com.tw/articles/10280025
     */
    getDirtyPaths(op: Operation) {
      switch(op.type) {
        case 'split_node': {
          const { path } = op;
          const ancestor = Path.levels(path);
          const nextPath = Path.next(path);
          return [...ancestor, nextPath];
        }
        case 'insert_text':
        case 'remove_text':
        case 'set_node': {
          const { path } = op;
          return Path.levels(path);
        }
        case 'insert_node': {
          const { node, path } = op;
          const levels = Path.levels(path);
          const descendants = Text.isText(node)
            ? []
            : Array.from(Node.nodes(node), ([, p]) => path.concat(p));
          return [...levels, ...descendants];
        }
        // merge 是往前 merge
        case 'merge_node': {
          const { path } = op;
          const ancestors = Path.ancestors(path);
          const prev = Path.previous(path);
          return [prev, ...ancestors];
        }
        case 'remove_node': {
          const { path } = op;
          return Path.ancestors(path);
        }
        case 'move_node': {
          const { path, newPath } = op;
          if (Path.equals(path, newPath)) {
            return [];
          }

          const oldAncestors: Path[] = [];
          const newAncestors: Path[] = [];

          // 因为移动可能对 path 有影响，所以需要 transform 
          // path 的祖先
          for (const ancestor of Path.ancestors(path)) {
            const p = Path.transform(ancestor, op)
            oldAncestors.push(p!)
          }

          // newPath 的祖先
          for (const ancestor of Path.ancestors(newPath)) {
            const p = Path.transform(ancestor, op)
            newAncestors.push(p!)
          }

          // newPath 自己
          const newParent = newAncestors[newAncestors.length - 1];
          const newIndex = newPath[newPath.length - 1];
          const resultPath = newParent.concat(newIndex);

          return [...oldAncestors, ...newAncestors, resultPath];
        }
        default:
          return [];
      }
    },

    /**
     * 规则1: 删除空白的文本节点
     * 规则2: 相同的文本节点可以合并
     */
    normalizeNode: (entry: NodeEntry) => {    
      const [node, path] = entry;
      if (Text.isText(node)) {
        return;
      }

      /**
       * 规则1：所有 element 都至少保证一个 text 子节点
       */
      if (Element.isElement(node) && node.children.length === 0) {
        const child = { text: '' };
        Transforms.insertNodes(editor, child, {
          at: path.concat(0),
        })
        return
      }

      /**
       * 为什么要引入 n 这个变量呢？比如现在 node.children 值为 [1,2,3,4,5]
       * 遍历到2的时候要把1，2合并，那么此时的 editor.children 就变为[12,3,4,5]
       * 合并之后还是继续遍历  node.children，此时通过 n 拿到正确的 prev
       */
      let n = 0;
      for (let i = 0; i < node.children.length; i++, n++) {
        const currentNode = Node.get(editor, path);
        const prev = currentNode.children[n - 1] as Descendant;
        const child = node.children[i];
        /**
         * 规则2: 合并空的或匹配的相邻文本节点。
         */
        if (Text.isText(child) && Text.isText(prev)) {
          /**
           * 规则2.1: 相邻且完全相同的 properties 的 Text 合并成一个节点
           */
          if (Text.equals(child, prev, { isEqualText: false })) {
            Transforms.mergeNodes(editor, {
              at: path.concat(n),
              match: n => Text.isText(n)
            });
            n--;
          }
          /**
           * 规则2.2: 后一个节点时空直接删除
           */
          else if (child.text === '') {
            Transforms.removeNodes(editor, {
              at: path.concat(n)
            });
            n--;
          }
        } else if (Element.isElement(child)) {
          // TODO
        }
      }
    },

    getFragment: () => {
      const { selection } = editor;
      return selection ? Node.fragment(editor, selection) : [];
    },

    insertFragment: (data: Node[]) => {
      Transforms.insertFragment(editor, data);
    },
  };

  (globalThis as any).editor = editor;

  return editor;
}
