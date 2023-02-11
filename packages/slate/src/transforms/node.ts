import { Transforms } from ".";
import { Editor, NodeMatch } from "../interfaces/editor";
import { Element } from "../interfaces/element";
import { Location } from "../interfaces/location";
import { Node } from '../interfaces/node';
import { Path } from "../interfaces/path";
import { Point } from "../interfaces/point";
import { Range } from "../interfaces/range";
import { Text } from "../interfaces/text";
import { SelectionMode } from '../interfaces/types';

interface SetNodeOptions {
  at?: Location;
}

interface SplitNodeOptions<T extends Node> {
  at?: Location;
  always?: boolean;
  match?: NodeMatch<T>;
  mode?: SelectionMode;
}

interface MergeNodeOptions<T extends Node> {
  at?: Location;
  match?: NodeMatch<T>;
  mode?: SelectionMode;
}

interface RemoveNodesOptions<T extends Node> {
  at?: Location;
  match?: NodeMatch<T>;
  mode?: SelectionMode;
}

interface MoveNodesOptions<T extends Node> {
  // 通过这三个属性确定节点位置
  at?: Location;
  match?: NodeMatch<T>;
  mode?: SelectionMode;
  to: Path;
}

export interface NodeTransforms {
  insertNodes: (editor: Editor, nodes: Node | Node[], options?: { select?: boolean; at?: Location }) => void;
  splitNodes: <T extends Node>(editor: Editor, options: SplitNodeOptions<T>) => void;
  setNode: (editor: Editor, props: Partial<Node>, options?: SetNodeOptions) => void;
  mergeNodes: <T extends Node>(editor: Editor, options?: MergeNodeOptions<T>) => void;
  removeNodes: <T extends Node>(editor: Editor, options?: RemoveNodesOptions<T>) => void;
  moveNodes: <T extends Node>(editor: Editor, options: MoveNodesOptions<T>) => void;
}

export const NodeTransforms: NodeTransforms = {
  splitNodes: <T extends Node>(editor: Editor, options: SplitNodeOptions<T>) => {
    Editor.withoutNormalizing(editor, () => {
      const { 
        always = false,
        match = n => Element.isElement(n),
        mode = 'lowest'
      } = options;

      let { at = editor.selection } = options;
      if (Path.isPath(at)) {
        // TODO
        return;
      }

      if (Range.isRange(at)) {
        if (Range.isCollapsed(at)) {
          at = at.anchor;
        } else {
          // TODO
          return;
        }
      }

      if (!at) {
        return;
      }

      const [highest] = Editor.nodes(editor, { at, match, mode });
      const [_, highestPath] = highest || [];
      if (!highestPath) {
        return;
      }

      const lowestPath = at.path;
      let position = at.offset;

      for (const [_, path] of Editor.levels(editor, { 
        at: lowestPath,
        reverse: true,
      })) {
        let split = false;
        if (path.length < highestPath.length || !path.length) {
          break
        }
        // 处于节点最左边或者最右边不处理
        if (always || !Editor.isEdge(editor, at, path)) {
          split = true;
          editor.apply({
            type: 'split_node',
            position,
            path,
          });
        }
        // 第一次 position 是用来 split SlateTextNode 的，
        // 后续的 position 是用来 split Slate ElementNode 的
        position = path[path.length - 1] + (split ? 1 : 0)
      }
    });
  },

  /**
   * 1. 对于在 point 中 insertNode，以 point 为中心将 textNode 分割为前后，随后插入节点
   * 2. 对于在 path 中 insertNode，就直接插入
   * 3. 对于在 range 中 insertNode，如果 range 是 collapsed 跟 point 处理同理，如果是非collaspd，将选中的 range 删除，随后插入
   */
  insertNodes: (
    editor: Editor,
    nodes: Node | Node[],
    options?: { select?: boolean; at?: Location }
  ) => {
    Editor.withoutNormalizing(editor, () => {
      let { select = true, at = editor.selection} = options || {};
      if (Node.isNode(nodes)) {
        nodes = [nodes]
      }

      if (!nodes.length) {
        return;
      }
      /**
       * 1. 将 at 处理成 path
       */
      if (Range.isRange(at)) {
        if (Range.isCollapsed(at)) {
          at = at.anchor;
        } else {
          // 把对应的文本删除，随后插入
          const [, end] = Range.edges(at);
          const pointRef = Editor.pointRef(editor, end);
          Transforms.delete(editor, { at });
          at = pointRef.unref()!;
        }
      }
      if (Point.isPoint(at)) {
        const isAtEnd = Editor.isEdge(editor, at, at.path);
        
        // 1. 先将 node 按照 at 位置分割
        const pathRef = Editor.pathRef(editor, at.path);
        Transforms.splitNodes(editor, { at, match: Text.isText });
        const path = pathRef.unref()!;
             
        // 如果是在节点的边缘插入插入新节点，因为在边缘节点不会去 splitNode，所以此时的 path 的值不会改变，所以需要手动指向 next
        at = isAtEnd ? Path.next(path) : path;
      }

      /**
       * 2. 将 node 插入到 at 的位置
       */
      if (!at) {
        return;
      }
      const parentPath = Path.parent(at);
      let index = at[at.length - 1];
      for (const node of nodes) {
        const path = parentPath.concat(index);
        editor.apply({
          type: 'insert_node',
          node,
          path,
        });
        index++;
        // 插入之后指向下一个
        at = Path.next(at);
      }

      // 3. 光标选中到插入的节点
      at = Path.previous(at);
      if (select) {
        const point = Editor.point(editor, at, { edge: 'end' });
        Transforms.select(editor, point);
      }
    });
  },

  /**
   * 1. 对于在 range 中 insertNode，如果 range 是 collapsed 不处理，如果是非collaspd，将选中的 range 进行 splitNode
   */
  setNode: (editor: Editor, props: Partial<Node>, options?: SetNodeOptions) => {
    Editor.withoutNormalizing(editor, () => {
      let { at = editor.selection } = options || {};
      if (!at) {
        return;
      }

      if (Range.isRange(at)) {
        if (Range.isCollapsed(at)) {
          return;
        }
        // 1. 光标扩展先对节点进行分割
        const rangeRef = Editor.rangeRef(editor, at, { affinity: 'inward' });
        /**
        * 从后到前分割好处：end 拆分为多个 node 对于 start 的 path 无影响
        * 从前到后：start 拆分为多个 node 对于 end 的 path 会有影响
        */
        const [start, end] = Range.edges(at);
        Transforms.splitNodes(editor, { at: end, match: Text.isText });
        Transforms.splitNodes(editor, { at: start, match: Text.isText });
        at = rangeRef.unref()!;

        if (!options?.at) {
          Transforms.select(editor, at);
        }

        // 2. 对选区的节点增加 mark
        for (const [textNode, textNodePath] of Node.texts(editor, { 
          from: at.anchor.path, 
          to: at.focus.path,
          reverse: Range.isBackward(at),
        })) {
          let hasChanges = false;

          const oldProperties = {};
          for (const o in textNode) {
            if (o === 'children' || o === 'text') {
              continue
            }
            oldProperties[o] = textNode[o];
          }

          for (const k in props) {
            if (k === 'children' || k === 'text') {
              continue
            }
  
            if (props[k] !== oldProperties[k]) {
              hasChanges = true;
              break;
            }
          }
  
          /**
         * TODO: 思考如果这里只存差异点是不是好一点？这种全量方式在协同冲突是不是无解了？
         */
          if (hasChanges) {
            editor.apply({
              type: 'set_node',
              newProperties: props,
              properties: oldProperties,
              path: textNodePath,
            })
          }
        }
      }
    });
  },

  /**
   * mergeNodes 实现起来比较麻烦，需要考虑 currentNode prevNode 是不是同一个层级。不同层级要先 moveNode 才能 mergeNode
   * 
   * 那么如何判断是否同一个层级呢？Path.next(currentPath) 拿到的就是和 currentPath 同一个层级的
   * 
   * 实现上会使用 Editor.previous 拿到上一个节点，但是此时的 previous 是根据 document 分布计算的，
   * 也就是说 previous 跟 currentPath 可能不是同一个层级。这个实现上没有问题，因为合并是 document 视图的合并，
   * 但是视图数据上需要做处理，先 moveNode， 将由来分支剩下的节点删除，才能 mergeNode
   */
  mergeNodes: <T extends Node>(
    editor: Editor, 
    options: MergeNodeOptions<T> = {}
  ): void => {
    Editor.withoutNormalizing(editor, () => {
      let { match } = options;
      const { mode = 'lowest', at = editor.selection  } = options;
      if (!at) {
        return
      }
      // 1. 默认使用 element 去合并，所以 match 默认值是获取 block
      if (!match) {
        // path 默认的 previous 需要有同一个 parent
        if (Path.isPath(at)) {
          const [parent] = Editor.parent(editor, at)
          match = n => parent.children.includes(n)
        } else {
          match = (node) => Element.isElement(node)
        }
      }

      // 2. 通过 Editor.nodes 返回符合 match 的 node.
      // 通过 Editor.previous 返回 match 的 previousNode
      const [currentNodeEntry] = Editor.nodes(editor, { at, mode, match });
      const prevNodeEntry = Editor.previous(editor, { at, mode, match });
      if (!currentNodeEntry || !prevNodeEntry) {
        return
      }

      const [currentNode, currentPath] = currentNodeEntry;
      const [prevNode, prevPath] = prevNodeEntry;
      // 3. 拿到同一个层级的数据，判断是否是同层级
      const isPreviousSibling = Path.isSibling(currentPath, prevPath)
      
      // 4. 往上寻找空的父节点
      const commonPath = Path.common(currentPath, prevPath);
      const emptyAncestor = Editor.above(editor, {
        at: currentPath,
        // 到公共 path 就可以停止了
        match: (n, p) => {
          return Path.isAncestor(commonPath, p) && hasSingleChildNest(editor, n)
        }
      });
      // 下面的移动可能会对当前 emptyAncestor 造成影响，所以需要 pathRef 一下
      const emptyPathRef = emptyAncestor && Editor.pathRef(editor, emptyAncestor[1]);

      if (!isPreviousSibling) {
        // node 要移动到这个 newPath
        const newPath = Path.next(prevPath);
        Transforms.moveNodes(editor, { to: newPath, at: currentPath });
      }

      if (emptyPathRef) {
        Transforms.removeNodes(editor, { at: emptyPathRef.current! });
      }

      let position;
      if (Text.isText(currentNode) && Text.isText(prevNode)) {
        position = prevNode.text.length;
      } else if (Element.isElement(currentNode) && Element.isElement(prevNode)) {
        position = prevNode.children.length
      } else {
        throw new Error('mergeNodes 前后节点不一致')
      }
      // 4. 计算 position 和 path
      editor.apply({
        type: 'merge_node',
        path: Path.next(prevPath),
        position,
      });
    });
  },

  removeNodes: <T extends Node>(
    editor: Editor,
    options: RemoveNodesOptions<T> = {},
  ) => {
    Editor.withoutNormalizing(editor, () => {
      const { at = editor.selection, mode = 'lowest' } = options;
      let { match } = options;
  
      if (!at) {
        return;
      }
  
      // 默认是删除 elemnt
      if (!match) {
        // 如果是 path 默认从 path 开始删除
        if (Path.isPath(at)) {
          const node = Node.get(editor, at);
          match = (n) => n === node;
        } else {
          // 如果是 range 或者 point，只要是 element（非editor）就可以删除
          match = (n) => Element.isElement(n);
        }
      }
      const nodeEntrys = Editor.nodes(editor, { match, at, mode });
      const pathRefs = Array.from(nodeEntrys, ([_, path]) => {
        return Editor.pathRef(editor, path);
      });
  
      for (const pathRef of pathRefs) {
        const path = pathRef.unref();
        if (!path) {
          continue;
        }
        editor.apply({
          type: 'remove_node',
          path,
          node: Node.get(editor, path),
        });
      }
    });
  },

  moveNodes: <T extends Node>(
    editor: Editor,
    options: MoveNodesOptions<T>,
  ) => {
    const {
      mode = 'lowest',
      at = editor.selection,
      to,
    } = options;

    let { match } = options;
    if (!at) {
      return;
    }

    if (!match) {
      // 如果是 path 默认从 at 开始移动
      if (Path.isPath(at)) {
        const node = Node.get(editor, at);
        match = (n) => n === node;
      } else {
        // 如果是 range 或者 point，只要是 element（非editor）就可以移动
        match = (n) => Element.isElement(n);
      }
    }

    const toRef = Editor.pathRef(editor, to);
    const nodeEntrys = Editor.nodes(editor, { mode, at, match });
    const pathRefs = Array.from(nodeEntrys, ([_, p]) => Editor.pathRef(editor, p));

    for (const pathRef of  pathRefs) {
      const path = pathRef.unref();
      const newPath = toRef.current;
      // path.length === 0 为 editor
      if (!path || !newPath || !path.length || !newPath.length) {
        continue;
      }
      editor.apply({ type: 'move_node', path, newPath });
      toRef.current = Path.next(newPath);
    }

    toRef.unref();
  },
}

const hasSingleChildNest = (editor: Editor, node: Node): boolean => {
  if (Element.isElement(node)) {
    const element = node as Element;
    if (element.children.length === 1) {
      return hasSingleChildNest(editor, element.children[0])
    } else {
      return false
    }
  } else if (Editor.isEditor(node)) {
    return false
  } else {
    return true
  }
}