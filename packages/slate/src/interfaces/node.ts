import { Editor } from './editor';
import { Element } from './element';
import { Path } from './path';
import { Text } from './text';

export type Descendant = Element | Text;
export type Node = Editor | Element | Text;
export type Ancestor = Editor | Element;
export type NodeEntry<T extends Node = Node> = [T, Path];

/**
 * slate 本身提供的
 */

export interface NodeInterface {
  isNodeList: (value: any) => boolean,
  isNode: (value: any) => boolean,
  get: (root: Node, path: Path) => Node,
  first: (root: Node, path: Path) => NodeEntry,
  last: (root: Node, path: Path) => NodeEntry,
  has:(root: Node, path: Path) => boolean,
  texts: (root: Node,) => Generator<NodeEntry<Text>, void, undefined>,
  nodes: (root: Node) => Generator<NodeEntry, void, undefined>,
  string: (node: Node) => string,
}

export const Node: NodeInterface = {
  isNodeList(value: any) {
    if (!Array.isArray(value)) {
      return false
    }
    // TODO: 原文有加缓存，暂时不清楚加缓存的作用
    const isNodeList = value.every(val => Node.isNode(val))
    return isNodeList
  },
  isNode(value: any) {
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
  /**
   * 以 path 为起点向下获取最开始的 slateTextNode
   */
  first(root: Node, path: Path): NodeEntry {
    let p = path.slice();
    let n = Node.get(root, path);
    while(true) {
      if (Text.isText(n)) {
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
      if (Text.isText(n)) {
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
  *texts(root: Node): Generator<NodeEntry<Text>, void, undefined> {
    for (const [node, path] of Node.nodes(root)) {
      if (Text.isText(node)) {
        yield [node, path]
      }
    }
  },
  /**
   * 从 root 开始返回所有子节点
   * 从根节点开始：
   *  - 递归子节点，
   *  - 递归兄弟节点
   *  - 没有兄弟节点返回父节点，重新开始
   */
  *nodes(
    root: Node,
  ): Generator<NodeEntry, void, undefined> {
    let n = root;
    let p: Path = [];
    const visited = new Set();

    while(true) {
      if (!visited.has(n)) {
        yield [n, p]
      }

      // 1. 向下遍历子节点
      if (!visited.has(n) && !Text.isText(n) && !!n.children.length) {
        visited.add(n);

        const newIndex = 0;
        p = p.concat(newIndex);
        n = Node.get(root, p);
        continue;
      }

      // 4. 向上回溯到最开始的起点，结束
      if (p.length === 0) {
        break
      }

      // 2.  遍历到叶子节点（文本节点 or 没有 children 的 slateElement）， 递归兄弟节点
      const newPath = Path.next(p);
      if (Node.has(n, newPath)) {
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
}