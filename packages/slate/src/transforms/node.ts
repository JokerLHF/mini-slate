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

interface SetNodeOptions<T extends Node> {
  at?: Location;
  match?: NodeMatch<T>;
  split?: boolean;
  mode?: SelectionMode;
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
  splitNodes: <T extends Node>(editor: Editor, options?: SplitNodeOptions<T>) => void;
  setNodes: <T extends Node>(editor: Editor, props: Partial<Node>, options?: SetNodeOptions<T>) => void;
  mergeNodes: <T extends Node>(editor: Editor, options?: MergeNodeOptions<T>) => void;
  removeNodes: <T extends Node>(editor: Editor, options?: RemoveNodesOptions<T>) => void;
  moveNodes: <T extends Node>(editor: Editor, options: MoveNodesOptions<T>) => void;
}

export const NodeTransforms: NodeTransforms = {
  splitNodes: <T extends Node>(
    editor: Editor,
    options: SplitNodeOptions<T> = {}
  ) => {
    Editor.withoutNormalizing(editor, () => {
      const {  mode = 'lowest' } = options;
      let { at = editor.selection, match, always = false } = options;
      let depth = 0;

      // path 需要拿到 父节点，因为 splitNode 如果是 Path 是根据父节点删除子节点的逻辑处理
      if (Path.isPath(at)) {
        const point = Editor.point(editor, at);
        const [parent] = Editor.parent(editor, at);
        match = n => n === parent;
        depth = at.length -1;
        always = true;
        at = point;
      }

      if (Range.isRange(at)) {
        if (Range.isCollapsed(at)) {
          at = at.anchor;
        } else {
          // range 的话要先删除掉 range
          const [, end] = Range.edges(at);
          const endRef = Editor.pointRef(editor, end);
          Transforms.delete(editor, { at });
          at = endRef.unref();          
        }
        match = n => Text.isText(n)
      }

      if (!match) {
        match = n =>  Element.isElement(n);
      }

      if (!at) {
        return;
      }

      const [highestNodeEntry] = Editor.nodes(editor, { at, match, mode });
      const [, highestPath] = highestNodeEntry;
      if (!highestPath) {
        return;
      }
      const position = depth ? at.path[depth]: at.offset;

      // 处于节点最左边或者最右边不处理
      if (always || !Editor.isEdge(editor, at, at.path)) {
        editor.apply({
          type: 'split_node',
          position,
          path: highestPath,
        });
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
  setNodes: <T extends Node>(
    editor: Editor,
    props: Partial<Node>,
    options: SetNodeOptions<T> = {},
  ) => {
    Editor.withoutNormalizing(editor, () => {
      const { split = false,  mode = 'lowest', } = options;
      let { at = editor.selection, match } = options;
      if (!at) {
        return;
      }

      if (split && Range.isRange(at)) {
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
      }

      if (!match) {
        // path 等于自己
        if (Path.isPath(at)) {
          const [node] = Editor.node(editor, at);
          match = n => n === node;
        } else {
          match = n => Element.isElement(n);
        }
      }

      // 2. 对选区的节点增加 mark
      for (const [node, nodePath] of Editor.nodes(editor, { at, match, mode, })) {
        let hasChanges = false;
        const oldProperties = {};
        const newProperties = {};

        if (!nodePath.length) {
          continue;
        }

        for (const k in props) {
          if (k === 'children' || k === 'text') {
            continue;
          }

          // 只记录不一致的, newProperties 表示最新的，oldProperties 表示之前的。方便做 undo
          if (props[k] !== node[k]) {
            oldProperties[k] = node[k];
            newProperties[k] = props[k];
            hasChanges = true;
            break;
          }
        }

        if (hasChanges) {
          editor.apply({
            type: 'set_node',
            newProperties: props,
            properties: oldProperties,
            path: nodePath,
          })
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