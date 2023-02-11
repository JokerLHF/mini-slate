import { Editor } from './editor';
import { Element } from './element';
import { Path } from './path';
import { Text } from './text';
import { Range } from './range';
import produce from 'immer';

export type Descendant = Element | Text;
export type Node = Editor | Element | Text;
export type Ancestor = Editor | Element;
export type NodeEntry<T extends Node = Node> = [T, Path];

export interface NodeNodesOptions {
  from?: Path;
  to?: Path;
  reverse?: boolean;
  pass?: (node: NodeEntry) => boolean;
}

export interface NodeTextsOptions {
  from?: Path;
  to?: Path;
  reverse?: boolean;
}

interface NodeLevelsOptions {
  reverse?: boolean;
}

/**
 * slate 本身提供的
 */

export interface NodeInterface {
  isNodeList: (value: any) => boolean;
  isNode: (value: any) => value is Node;
  get: (root: Node, path: Path) => Node;
  parent: (root: Node, path: Path) => Ancestor;
  first: (root: Node, path: Path) => NodeEntry;
  last: (root: Node, path: Path) => NodeEntry;
  has:(root: Node, path: Path) => boolean;
  texts: (root: Node, options?: NodeTextsOptions) => Generator<NodeEntry<Text>, void, undefined>;
  nodes: (root: Node, options?: NodeNodesOptions) => Generator<NodeEntry, void, undefined>;
  string: (node: Node) => string;
  levels: (root: Node, path: Path, options?: NodeLevelsOptions) => Generator<NodeEntry, void, undefined>;
  fragment: (root: Node, range: Range) => Descendant[];
}

export const Node: NodeInterface = {
  isNodeList(value: any) {
    if (!Array.isArray(value)) {
      return false
    }
    const isNodeList = value.every(val => Node.isNode(val))
    return isNodeList
  },

  isNode(value: any): value is Node {
    return (
      Text.isText(value) || Element.isElement(value) || Editor.isEditor(value)
    )
  },
  /**
   * 从 root 开始，根据 path 获取 slateNode
   */
  get(root: Node, path: Path): Node {
    let node = root;    
    for (let i = 0; i < path.length; i++) {
      const p = path[i];
      if (Text.isText(node) || !node.children[p]) {
        throw new Error(`Cannot find a descendant at path [${path}] in node`);
      }
      node = node.children[p];
    }

    return node;
  },

  parent(root: Node, path: Path): Ancestor {
    const parentPath = Path.parent(path);
    const parent = Node.get(root, parentPath);
    if (Text.isText(parent)) {
      throw new Error(
        `Cannot get the parent of path [${path}] because it does not exist in the root.`
      )
    }
    return parent;
  },

  /**
   * 以 path 为起点向下获取最开始的 slateTextNode
   */
  first(root: Node, path: Path): NodeEntry {
    let p = path.slice();
    let n = Node.get(root, path);
    while(true) {
      if (Text.isText(n) || n.children.length === 0) {
        break;
      }
      n = n.children[0]
      p.push(0);
    }

    return [n, p];
  },
  /**
   * 以 path 为起点向下获取最后的 slateTextNode
   */
  last(root: Node, path: Path): NodeEntry {
    let p = path.slice();
    let n = Node.get(root, path);
    while(true) {
      if (Text.isText(n) || n.children.length === 0) {
        break;
      }
      const i = n.children.length - 1;
      n = n.children[i]
      p.push(i);
    }

    return [n, p];
  },
  /**
   * 判断 path 是否存在
   */
  has(root: Node, path: Path): boolean {
    let node = root;
    for (let i = 0; i < path.length; i++) {
      const p = path[i];
      // path 还没有结束，但是已经出现 textNode， textNode 应该在 path 最尾部。
      if (Text.isText(node) || !node.children[p]) {
        return false;
      }
      node = node.children[p];
    }
    return true;
  },

  /**
   * 从 root 开始，返回所有 文本子节点
   */
  *texts(root: Node, options: NodeTextsOptions = {}): Generator<NodeEntry<Text>, void, undefined> {
    for (const [node, path] of Node.nodes(root, options)) {
      if (Text.isText(node)) {
        yield [node, path]
      }
    }
  },
  /**
   * !!!!!! 如果是 reverse=true，那么 from to 就需要自己 倒序
   * 从 root 开始返回所有子节点
   * 从根节点开始：
   *  - 递归子节点，
   *  - 递归兄弟节点
   *  - 没有兄弟节点返回父节点，重新开始
   */
  *nodes(
    root: Node,
    options: NodeNodesOptions = {},
  ): Generator<NodeEntry, void, undefined> {
    // pass=true 表示忽略遍历子节点
    const { from = [], to, reverse = false, pass } = options;
    let n = root;
    let p: Path = [];
    const visited = new Set();

    while(true) {
      // path 不再 from 和 to 中间
      if (to && (reverse ? Path.isBefore(p, to) : Path.isAfter(p, to))) {
        break
      }

      if (!visited.has(n)) {
        yield [n, p]
      }

      // 1. 向下遍历子节点
      if (
        !visited.has(n) &&
        !Text.isText(n) &&
        !!n.children.length &&
        (pass ? pass([n, p]) === false : true)
      ) {
        visited.add(n);

        let newIndex = reverse ? n.children.length - 1 : 0;
        // 有传入 from 的，走 from 那一条路径
        if (Path.isAncestor(p, from)) {
          newIndex = from[p.length];
        }
  
        p = p.concat(newIndex);
        n = Node.get(root, p);
        continue;
      }

      // 4. 向上回溯到最开始的起点，结束
      if (p.length === 0) {
        break
      }

      // 2. 递归兄弟节点
      const newPath = reverse ? Path.previous(p) : Path.next(p);
      if (Node.has(root, newPath)) {
        p = newPath;
        n = Node.get(root, newPath);
        continue;
      }

      // 3. 兄弟节点遍历结束，向上回溯父节点
      p = Path.parent(p);
      n = Node.get(root, p);
    }
  },
  /**
   * 获取 node 节点下的所有 slateText 长度
   */
  string(node: Node): string {
    if (Text.isText(node)) {
      return node.text
    } else {
      return node.children.map(Node.string).join('')
    }
  },

  *levels(
    root: Node,
    path: Path,
    options: NodeLevelsOptions = {}
  ): Generator<NodeEntry, void, undefined> {
    for (const p of Path.levels(path, options)) {
      const n = Node.get(root, p);
      yield [n, p]
    }
  },

  fragment(root: Node, range: Range): Descendant[] {    
    const newRoot = produce({ children: root.children }, r => {
      const [start, end] = Range.edges(range);
      const nodeEntries = Node.nodes(r, {
        reverse: true, // 这里使用 reverse 从后往前输出节点，使得即使后面的节点被删了，也不会影响前面节点的 path
        pass: ([, path]) => !Range.includes(range, path),
      })
      for (const nodeEntry of nodeEntries) {
        let [_, path] = nodeEntry;
        if (!Range.includes(range, path)) {
          const parent = Node.parent(r, path)
          const index = path[path.length - 1]
          parent.children.splice(index, 1)
        }
  
        if (Path.equals(path, end.path)) {
          const leaf = Node.get(r, path);
          leaf.text = leaf.text.slice(0, end.offset);
        }

        if (Path.equals(path, start.path)) {
          const leaf = Node.get(r, path);
          leaf.text = leaf.text.slice(start.offset);
        }
      }
    });
    
    return newRoot.children;
  }
}