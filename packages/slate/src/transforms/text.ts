import { Transforms } from ".";
import { Editor } from "../interfaces/editor";
import { Element } from "../interfaces/element";
import { Location } from '../interfaces/location';
import { Node, NodeEntry } from "../interfaces/node";
import { Path } from "../interfaces/path";
import { Point } from "../interfaces/point";
import { Range } from "../interfaces/range";
import { RangeRef } from "../interfaces/range-ref";
import { Text } from "../interfaces/text";

export interface TextDeleteOptions {
  reverse?: boolean;
  at?: Location;
}

interface InsertFragmentOptions {
  at?: Location;
}

export interface TextTransforms {
  insertText: (editor: Editor, text: string) => void;
  delete: (editor: Editor, options?: TextDeleteOptions) => void;
  insertFragment: (editor: Editor, fragment: Node[], options?: InsertFragmentOptions) => void;
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
          // 把对应的文本删除，随后插入
          const [, end] = Range.edges(at);
          const pointRef = Editor.pointRef(editor, end);
          Transforms.delete(editor, { at });
          at = pointRef.unref()!;
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
      let lastPath: Path | undefined

      for (const nodeEntry of Node.nodes(editor, { from: start.path, to: end.path })) {
        const [_, path] = nodeEntry;
        
        // Node.nodes是深度遍历，也就是 parent 会被先执行。如果 parent 被 matches 了， lastPath = parentPath
        // 此时遍历到子节点，childrenPath 就不需要 matches，因为中间节点删除 parent 就可以了
        if (lastPath && Path.compare(path, lastPath) === 0) {
          continue;
        }

        // 跟 start end 同个祖先不处理，等到下面的 apply 逻辑去处理
        if (
          !Path.isCommon(path, start.path) &&
          !Path.isCommon(path, end.path)
        ) {
          matches.push(nodeEntry);
          lastPath = path;
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
        Transforms.removeNodes(editor, { at: path });
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

      if (
        !isSingleText &&
        endRef.current &&
        startRef.current
      ) {
        Transforms.mergeNodes(editor, {
          at: endRef.current,
        });
      }

      startRef.unref();
      endRef.unref();
    });
  },

  insertFragment(
    editor: Editor,
    fragment: Node[],
    options?: InsertFragmentOptions
  ) {
    Editor.withoutNormalizing(editor, () => {
      let { at = editor.selection } = options || {};
      if (!fragment.length || !at) {
        return;
      }
      // 1. 将 at 处理为 point
      if (Range.isRange(at)) {
        if (Range.isCollapsed(at)) {
          at = at.anchor;
        } else {
          const [_, end] = Range.edges(at);
          const pointRef = Editor.pointRef(editor, end);
          // TODO: 这里的 selection 还有 bug
          Transforms.delete(editor, { at });
          at = pointRef.unref();
        }
      }
      if (Path.isPath(at)) {
        at = Editor.point(editor, at, { edge: 'end' });
      }
      if (!at) {
        return;
      }
  
      const blockMatch = Editor.above(editor, {
        match: n => Element.isElement(n),
        at,
        reverse: true,
      })!;
      const [_, blockPath] = blockMatch;
      const isBlockStart = Editor.isStart(editor, at, blockPath);
      const isBlockEnd = Editor.isEnd(editor, at, blockPath);
      const isBlockEmpty = isBlockStart && isBlockEnd;
  
      const mergeStart = !isBlockStart;
      const mergeEnd = !isBlockEnd;
      const [, firstPath] = Node.first({ children: fragment }, []);
      const [, lastPath] = Node.last({ children: fragment }, []);
      /**
       * 对于是 mergeStart ｜ mergeEnd 路径上的，最终只需要 textState 节点，不需要其父节点。
       *    所以在 Node.nodes 的时候需要不断递归其子节点，不是 textState 返回 false，
       *    对于 matcher 只需要保留 textState， 所以不是 textState 返回 false
       * 对于不是 mergeStart ｜ mergeEnd 路径上的，一整条路径都需要复制，所以就不需要递归其子节点了
       *   所以在 Node.nodes 的时候不需要断递归其子节点，默认返回 true
       *   对于 matcher 只都需要保留，默认返回 true
       */
      const matcher = ([n, p]: NodeEntry) => {
        const isRoot = p.length === 0;
        if (isRoot) {
          return false;
        }
  
        if (isBlockEmpty) {
          return true;
        }
  
        if (
          mergeStart &&
          Element.isElement(n) &&
          Path.isAncestor(p, firstPath)
        ) {
          return false;
        }
  
        if (
          mergeEnd &&
          Element.isElement(n) &&
          Path.isAncestor(p, lastPath)
        ) {
          return false;
        }
  
        return true;
      }
  
      const matches: NodeEntry[] = [];
      for(const nodeEntry of Node.nodes(
        { children: fragment },
        { pass: matcher }
      )) {
        if (matcher(nodeEntry)) {
          matches.push(nodeEntry)
        }
      }

      /**
       * 正常来说，starts ends 都只能是文本，middles 都是element
       */
      const starts: Text[] = [];
      const middles: Node[] = [];
      const ends: Text[] = [];
      let starting = true;

      for (const [node] of matches) {
        if (Element.isElement(node)) {
          starting = false;
          middles.push(node);
        } else if (starting) {
          starts.push(node);
        } else {
          ends.push(node);
        }
      }

      const inlinePath = at.path;
      const isInlineStart = Editor.isStart(editor, at, inlinePath);
      const isInlineEnd = Editor.isEnd(editor, at, inlinePath);
      /**
       * [0,0]
       *   [0,0,0] 111
       * [0,1]
       *   [0,1,0] 222
       * [0,2]
       *   [0,2,0] 333
       * 如果是在 333| 插入的话，因为是 inlineEnd，所以没有 ends，有 starts
       * 如果是在 |111 插入的话，因为是 inlineStart，所以有 ends，没有 starts
       * 如果是在 22｜2 插入的话，因为不是 inlineStart 和 inlineEnd 所以存在 starts，ends
       */
      const middleRef = Editor.pathRef(
        editor,
        isBlockEnd && !ends.length ? Path.next(blockPath) : blockPath 
      );
      const endRef = Editor.pathRef(
        editor,
        isInlineEnd ? Path.next(inlinePath) : inlinePath
      );
      Transforms.splitNodes(editor, { 
        at, 
        match: n => middles.length ? Element.isElement(n) : Text.isText(n),
        mode: 'lowest'
      });

      const startRef = Editor.pathRef(
        editor,
        !isInlineStart ? Path.next(inlinePath) : inlinePath
      );

      Transforms.insertNodes(editor, starts, {
        at: startRef.current!,
      });
      Transforms.insertNodes(editor, middles, {
        at: middleRef.current!,
      });
      Transforms.insertNodes(editor, ends, {
        at: endRef.current!,
      });
  
      startRef.unref();
      middleRef.unref();
      endRef.unref();
    });
  }
}
