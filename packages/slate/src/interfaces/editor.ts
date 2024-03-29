import { Ancestor, Descendant, NodeEntry } from "./node";
import { isPlainObject } from 'is-plain-object';
import { Node } from './node';
import { Operation } from "./operation";
import { Range } from './range';
import { Point } from './point';
import { LeafEdge, RangeDirection, RangeMode, TextDirection } from "./types";
import { Path } from "./path";
import { Location } from './location';
import { Text } from "./text";
import { Element } from './element';
import { ExtendedType } from "./custom-types";
import { PointRef } from "./point-ref";
import { DIRTY_PATHS, DIRTY_PATHS_KEYS, NORMALIZING, PATH_REFS, POINT_REFS, RANGE_REFS } from "../utils/weak-maps";
import { RangeRef } from "./range-ref";
import { PathRef } from "./path-ref";
import { SelectionMode } from './types';

export type BaseSelection = Range | null;
export type Selection = ExtendedType<BaseSelection>;

export interface EditorPointOptions {
  edge?: LeafEdge
}

export interface EditorPathOptions {
  edge?: LeafEdge
}

export interface EditorNodeOptions {
  edge?: LeafEdge
}

export interface EditorNodesOptions<T extends Node> {
  at?: Location;
  match?: NodeMatch<T>;
  reverse?: boolean;
  mode?: SelectionMode;
  voids?: boolean;
}

export interface EditorPositionsOptions {
  at?: Location,
  reverse?: boolean,
  voids?: boolean;
}

export type NodeMatch<T extends Node> =
  | ((node: Node, path: Path) => node is T)
  | ((node: Node, path: Path) => boolean)

export interface EditorLevelsOptions<T extends Node> {
  at?: Location;
  match?: NodeMatch<T>;
  reverse?: boolean;
}
export interface EditorAboveOptions<T extends Node> {
  at?: Location;
  match?: NodeMatch<T>;
  mode?: RangeMode;
}

export interface EditorPreviousOptions<T extends Node> {
  at?: Location;
  match?: NodeMatch<T>;
  mode?: SelectionMode;
  voids?: boolean;
}

export interface EditorParentOptions {
  edge?: LeafEdge
}

export interface PointRefOptions {
  affinity: TextDirection | null
}

export interface RangeRefOptions {
  affinity: RangeDirection | null
}

export interface PathRefOptions {
  affinity: TextDirection | null
}

export interface BeforeOptions {
  distance?: number;
}

export interface AfterOptions {
  distance?: number;
}

export interface EditorVoidOptions {
  at?: Location
  mode?: RangeMode
}

export interface EditorStringOptions {
  voids?: boolean;
}

/**
 * slate 本身提供的
 */

export interface BaseEditor {
  root: string;

  children: Descendant[];
  selection: Selection;
  operations: Operation[];
  marks: Record<string, any> | null;

  // Schema-specific node behaviors.
  onChange: () => void;
  isInline: (element: Element) => boolean;
  insertText: (text: string) => void;
  deleteBackward: () => void;
  deleteFragment: () => void;

  addMark: (key: string, value: any) => void;
  removeMark: (key: string) => void;

  // Overrideable core actions.
  apply: (operation: Operation) => void;
  getDirtyPaths: (op: Operation) => Path[];
  normalizeNode: (entry: NodeEntry) => void;

  getFragment: () => Descendant[];
  insertFragment: (data: Node[]) => void;
  insertBreak: () => void;
  insertNode: (node: Node) => void;

  isVoid: (element: Element) => boolean;
}

export type Editor = ExtendedType<BaseEditor>;

export interface EditorInterface {
  isEditor: (value: any) => boolean;
  range: (editor: Editor, at: Location, to?: Location) => Range;
  path: (editor: Editor, at: Location, options?: EditorPathOptions) => Path;
  point: (editor: Editor, at: Location, options?: EditorPointOptions) => Point;
  hasPath: (editor: Editor, path: Path) => boolean;
  node: (editor: Editor, at: Location, options?: EditorNodeOptions) => NodeEntry;
  nodes: <T extends Node>(
    editor: Editor,
    options?: EditorNodesOptions<T>
  ) => Generator<NodeEntry<T>, void, undefined>;
  insertNode: (editor: Editor, node: Node) => void;

  before: (editor: Editor, at: Location, options?: BeforeOptions) => Point | undefined;
  after(editor: Editor, at: Location, options?: AfterOptions): Point | undefined;

  previous: <T extends Node>(
    editor: Editor,
    options?: EditorPreviousOptions<T>
  ) => NodeEntry<T> | undefined;
  parent: (
    editor: Editor,
    at: Location,
    options?: EditorParentOptions
  ) => NodeEntry<Ancestor>;
  positions: (editor: Editor, operations?: EditorPositionsOptions) => Generator<Point, void, undefined>;

  marks: (editor: Editor) => Record<string, any>;
  addMark: (editor: Editor, key: string, value: any) => void;
  removeMark: (editor: Editor, key: string) => void;

  insertText: (editor: Editor, text: string) => void;
  deleteBackward: (editor: Editor) => void;
  deleteFragment: (editor: Editor) => void;
  getFragment: (editor: Editor) => Descendant[];
  insertFragment: (editor: Editor, data: Descendant[]) => void;

  above: <T extends Node> (
    editor: Editor, 
    options?: EditorAboveOptions<T>
  ) =>  NodeEntry<T> | undefined;
  levels: <T extends Node>(
    editor: Editor,
    options?: EditorLevelsOptions<T>
  ) => Generator<NodeEntry<T>, void, undefined>;

  isEdge: (editor: Editor, point: Point, at: Location) => boolean;
  isEnd: (editor: Editor, point: Point, at: Location) => boolean;
  isStart: (editor: Editor, point: Point, at: Location) => boolean;
  start: (editor: Editor, at: Location) => Point;
  end: (editor: Editor, at: Location) => Point;

  pointRef: (
    editor: Editor,
    point: Point,
    options?: PointRefOptions,
  ) => PointRef;
  pointRefs: (editor: Editor) => Set<PointRef>;

  rangeRef: (
    editor: Editor,
    range: Range,
    options?: RangeRefOptions,
  ) => RangeRef;
  rangeRefs: (editor: Editor) => Set<RangeRef>;

  pathRef: (
    editor: Editor,
    path: Path,
    options?: PathRefOptions,
  ) => PathRef;
  pathRefs: (editor: Editor) => Set<PathRef>;

  getDirtyPaths: (op: Operation) => Path[];
  isNormalizing: (editor: Editor) => boolean;
  setNormalizing: (editor: Editor, isNormalizing: boolean) => void;
  withoutNormalizing: (editor: Editor, fn: () => void) => void;
  normalize: (editor: Editor) => void;

  insertBreak: (editor: Editor) => void;
  isEmpty: (editor: Editor, element: Element) => boolean;
  string: (editor: Editor, at: Location, options?: EditorStringOptions) => string;
  isBlock: (editor: Editor, value: Element) => boolean;
  isInline: (editor: Editor, value: Element) => boolean;

  isVoid: (editor: Editor, value: Element) => boolean;
  void: (
    editor: Editor,
    options?: EditorVoidOptions
  ) => NodeEntry<Element> | undefined;
  hasInlines: (editor: Editor, element: Element) => boolean;
}

export const root = `__SLATE__${Math.random()}`;

export const Editor: EditorInterface = {
  isEditor(value: any) {
    if (!isPlainObject(value)) {
      return false
    }
    /**
     * slate 实现是判断 value 存在 BaseEditor 存在的属性和方法
     * 但是不需要那么复杂，给一个标识就可。标识使用随机数，用户就不可能使用相同的标识混乱。
     */
    return value.root === root;
  },

  isInline(editor: Editor, value: Element): boolean {
    return editor.isInline(value)
  },

  isVoid(editor: Editor, value: Element): boolean {
    return editor.isVoid(value)
  },

  void(
    editor: Editor,
    options: EditorVoidOptions = {}
  ): NodeEntry<Element> | undefined {
    return Editor.above(editor, {
      ...options,
      match: n => Element.isElement(n) && Editor.isVoid(editor, n),
    })
  },

  isBlock(editor: Editor, value: Element): boolean {
    return !editor.isInline(value)
  },
  /**
   * 判断是否是空节点
   */
  isEmpty(editor: Editor, element: Element): boolean {
    const { children } = element;
    const [first] = children;
    const isNodeChildren = children.length === 0;
    const hasEmptyTextChildren = children.length === 1 && Text.isText(first) && first.text === '';
    return isNodeChildren || hasEmptyTextChildren;
  },

  insertNode (editor: Editor, node: Node): void {
    editor.insertNode(node)
  },

  insertBreak (editor: Editor) {
    editor.insertBreak();
  },

  getDirtyPaths (op: Operation) {
    return Editor.getDirtyPaths(op);
  },

  /**
   * Get the start point of a location.
   */
  end(editor: Editor, at: Location): Point {
    return Editor.point(editor, at, { edge: 'end' });
  },

  // point 是否是 at 区域的 end
  isEnd (editor: Editor, point: Point, at: Location): boolean {
    const end = Editor.end(editor, at);
    return Point.equals(end, point);
  },

  /**
   * Get the start point of a location.
   */
  start(editor: Editor, at: Location): Point {
    return Editor.point(editor, at, { edge: 'start' });
  },

  // point 是否是 at 区域的 start
  isStart(editor: Editor, point: Point, at: Location): boolean {
    // PERF: If the offset isn't `0` we know it's not the start.
    if (point.offset !== 0) {
      return false
    }

    const start = Editor.start(editor, at)
    return Point.equals(point, start)
  },

  // point is edge in at
  isEdge (editor: Editor, point: Point, at: Location): boolean {
    return Editor.isStart(editor, point, at) || Editor.isEnd(editor, point, at);
  },

  addMark(editor: Editor, key: string, value: any): void {
    editor.addMark(key, value)
  },

  removeMark(editor: Editor, key: string): void {
    editor.removeMark(key)
  },

  marks(ediotr: Editor): Record<string, any> {
    const { selection } = ediotr;
    if (!selection) {
      return {};
    }

    // 选区扩展的时候，拿到选区第一个节点
    if (!Range.isCollapsed(selection)) {
      const [match] = Editor.nodes(ediotr, { match: Text.isText });
      if (!match) {
        return {};
      }
      const [node] = match;
      const { text, ...rest } = node;
      return rest;
    } 
    // 选区折叠的时候根据选区
    const { anchor: { path, offset }} = selection;
    const [node] = Editor.node(ediotr, path);
    /**
     * 假设【】表示加粗：
     * 现有：111 光标【222】。此时光标应该属于前一个节点 111 的
     */
    if (offset === 0) {
      // 拿到前一个 textNode
      const [prev] = Editor.previous(ediotr, { at: path, match: Text.isText }) || [];
      if (prev) {
        const { text, ...rest } = prev;
        return rest;
      }
    }

    const { text, ...rest } = node;
    return rest;
  },
  /**
   * 根据 location 中得到 textNode range
   */
  range(editor: Editor, at: Location, to?: Location): Range {
    if (Range.isRange(at) && !to) {
      return at;
    }

    to = to || at;
    const start = Editor.start(editor, at);
    const end = Editor.end(editor, to);
    return { anchor: start, focus: end }
  },
  
  /**
   * 从 location 中得到 textNode point,
   *    edge-start: 获得从 location 开始的 textNode point
   *    edge-end:   获得从 location 结束的 textNode point
   */
  point(editor: Editor, at: Location, options: EditorPointOptions = {}): Point {
    const { edge = 'start' } = options;
    if (Path.isPath(at)) {
      let path;

      if (edge === 'start') {
        const [_, firstPath] = Node.first(editor, at);
        path = firstPath;
      } else {
        const [_, lastPath] = Node.last(editor, at);
        path = lastPath;
      }

      const node = Node.get(editor, path);

      if (!Text.isText(node)) {
        throw new Error(`Cannot get the ${edge} point in the node at path [${at}] because it has no ${edge} text node.`);
      }

      return { path, offset:  edge === 'end' ? node.text.length : 0 };
    }

    if (Range.isRange(at)) {
      const [start, end] = Range.edges(at)
      return edge === 'start' ? start : end
    }

    return at;
  },
  
  /**
   * 从 location 中获取 path
   *  1. 对于 path 如果有指定边界（最左边，最右边），则获取对应的 TextPath， 无则直接返回 path
   *  2. 对于 range 如果有指定边界（最左边，最右边），则获取对应的 TextPath， 无则获取共同的祖先
   *  3. point 直接返回TextPath，
   */
  path(editor: Editor, at: Location, options: EditorPathOptions = {}): Path {
    const { edge } = options;
  
    if (Path.isPath(at)) {
      if (edge === 'start') {
        const [_, firstPath] = Node.first(editor, at);
        at = firstPath;
      } else if (edge === 'end') {
        const [_, lastPath] = Node.last(editor, at);
        at = lastPath;
      }
    }

    if (Range.isRange(at)) {
      if (edge === 'start') {
        at = Range.start(at);
      } else if (edge === 'end') {
        at = Range.end(at);
      } else {
        at = Path.common(at.anchor.path, at.focus.path)
      }
    }

    if (Point.isPoint(at)) {
      at = at.path;
    }

    return at;
  },

  hasPath(editor: Editor, path: Path): boolean {
    return Node.has(editor, path)
  },

  /**
   * 根据 location 找到 slateElement
   */
  node(
    editor: Editor,
    at: Location,
    options: EditorNodeOptions = {}
  ): NodeEntry {
    const path = Editor.path(editor, at, options)
    const node = Node.get(editor, path)
    return [node, path]
  },

  /**
   * 根据 location 计算出 node 的范围， 
   * 根据 mode 模式，返回符合 match 的节点
   * 即使 selection 是反向，默认也是正向返回。如果要反向返回，需要设置 reverse=true
   */
  *nodes<T extends Node>(
    editor: Editor,
    options: EditorNodesOptions<T> = {}
  ): Generator<NodeEntry<T>, void, undefined> {
    const {
      at = editor.selection,
      match = () => true,
      reverse = false,
      mode = 'all',
      voids = false,
    } = options;

    if (!at) {
      return;
    }
    // 1. 计算 from to， 
    const first = Editor.path(editor, at, { edge: 'start' });
    const last = Editor.path(editor, at, { edge: 'end' });
    const from = reverse ? last : first;
    const to = reverse ? first : last;

    const nodeEntrys = Node.nodes(editor, {
      from,
      to,
      reverse,
      pass: ([node]) => {
        // 不需要 void 节点的时候忽略 void 节点，pass=true 忽略遍历子节点
        return voids ? false : Element.isElement(node) && Editor.isVoid(editor, node)
      }
    });

    let lastNodeEntry: NodeEntry<T> | undefined;

    for (const [node, path] of nodeEntrys) {
      // 0 表示 path 和 another 是祖先关系或者相等关系
      const isLower = lastNodeEntry && Path.compare(path, lastNodeEntry[1]) === 0;
      // highest 模式下，一条路径只返回最高的，其他的都抛弃。等待变量到另外一条路径
      if (mode === 'highest' && isLower) {
        continue;
      }

      if (!match(node, path)) {
        continue;
      }

      // lowest 模式下找到更低的匹配 
      if (mode === 'lowest' && isLower) {
        lastNodeEntry = [node, path];
        continue;
      }
      // lowest 模式找到遇到不是更低的匹配就证明上一条路径已经匹配忘了，找到最低的了，返回上一次的
      const emit: NodeEntry<T> | undefined = mode === 'lowest' ? lastNodeEntry : [node, path];
      if (emit) {
        yield emit;
      }

      lastNodeEntry = [node, path];
    }

    // lowest 模式总是在新的路径返回上一次路径的结果，最后一次需要重新返回
    if (mode === 'lowest' && lastNodeEntry) {
      yield lastNodeEntry;
    }
  },

  hasInlines(editor: Editor, element: Element): boolean {
    return element.children.some(
      n => Text.isText(n) || Editor.isInline(editor, n)
    )
  },

  /**
   * 在 at 范围之内，返回所有的 point 节点
   */
  *positions(editor: Editor, options: EditorPositionsOptions = {}): Generator<Point, void, undefined> {
    const { at, reverse = false, voids = false } = options;
    if (!at) {
      return;
    }
    
    const range = Editor.range(editor, at);
    const [start, end] = Range.edges(range);

    for (const nodeEntry of Editor.nodes(editor, {
      at: range,
      reverse,
      voids,
    })) {
      const [node, nodePath] = nodeEntry;

      if (Element.isElement(node)) {
        // 在不考虑 voids 的情况下：void 节点不需要返回所有 text 位置， 只需要返回第一个 position 位置
        if (!voids && editor.isVoid(node)) {
          yield Editor.start(editor, nodePath);
          continue;
        }

        // // 返回所有子节点的文本
        // if (Editor.hasInlines(editor, node)) {
        //   /**
        //    *     element
        //    * text1 text2 text3
        //    * text2 就是 end 的情况下直接返回 end
        //    */
        //   const s = Path.isAncestor(nodePath, start.path) ? start : Editor.start(editor, nodePath);
        //   const e = Path.isAncestor(nodePath, end.path) ? end : Editor.end(editor, nodePath);
        //   blockText = Editor.string(editor, { anchor: s, focus: e }, { voids })
        // }
      }
      
      if (Text.isText(node)) {
        const isFirstNode = Path.equals(nodePath, start.path);
        const isEndNode = Path.equals(nodePath, end.path);
        const endOffset = isEndNode ? end.offset : node.text.length;
        const startOffset = isFirstNode ? start.offset : 0;
  
        if (reverse) {
          let offset = node.text.length;
          while(true) {
            if (offset > endOffset) {
              offset--;
              continue;
            }
            if (offset < startOffset) {
              break;
            }
            yield { path: nodePath, offset }
            offset--;
          }
          continue;
        }
  
        let offset = 0;
        while(true) {
          // 在开始point之前不参与
          if (offset < startOffset) {
            offset++;
            continue;
          }
          // 在结束point之后表示
          if (offset > endOffset) {
            break;
          }
          yield { path: nodePath, offset }
          offset++;
        }
      }
    }
  },

  /**
   * 根据 location 返回上一步 point
   */
  before(editor: Editor, at: Location, options: BeforeOptions = {}): Point | undefined {
    const { distance = 1 } = options;
    let d = 0;
    // 从 root 节点最左边的 textPoint
    const anchor = Editor.start(editor, []);
    // 获取从 at 开始最左边的节点
    const focus = Editor.start(editor, at);
    const range = { anchor, focus };
    let target;

    for (const node of Editor.positions(editor, { 
      at: range,
      reverse: true
    })) {
      if (d > distance) {
        break;
      }

      // 排除掉 at 自己
      if (d !== 0) {
        target = node;
      }
      d++;
    }

    return  target;
  },

  /**
   * 根据 location 返回后一步 point
   */
  after(editor: Editor, at: Location, options: AfterOptions = {}): Point | undefined {
    const { distance = 1 } = options;
    let d = 0;
    // 从 root 节点最右边的 textPoint
    const anchor = Editor.end(editor, at);
    // 获取从 at 开始最左边的节点
    const focus = Editor.end(editor, []);
    const range = { anchor, focus };
    let target;

    for (const node of Editor.positions(editor, { 
      at: range,
    })) {
      if (d > distance) {
        break;
      }

      // 排除掉 at 自己
      if (d !== 0) {
        target = node;
      }
      d++;
    }

    return  target;
  },

  string(editor: Editor, at: Location, options: EditorStringOptions = {}) {
    const { voids = false } = options
    const range = Editor.range(editor, at);
    const [start, end] = Range.edges(range);

    let text = '';
    for (const [textNode, textNodePath] of Editor.nodes(editor, { at: range, match: Text.isText, voids })) {
      if (Path.equals(start.path, textNodePath)) {
        text += textNode.text.slice(start.offset);
      } else if (Path.equals(end.path, textNodePath)) {
        text += textNode.text.slice(end.offset);
      } else {
        text += textNode.text;
      }
    };

    return text;
  },

  insertText(editor: Editor, text: string) {
    editor.insertText(text);
  },

  deleteBackward(editor: Editor): void {
    editor.deleteBackward();
  },

  deleteFragment(editor: Editor): void {
    editor.deleteFragment();
  },

  getFragment(editor: Editor): Descendant[] {
    return editor.getFragment();
  },

  insertFragment(editor: Editor, data: Node[]) {
    editor.insertFragment(data);
  },

  /**
   * 向上找到第一个 match 的节点（除了本身）,
   *  默认是从节点到 editor 往上
   *  reverse 是从 editor 到节点
   */
  above<T extends Node>(
    editor: Editor,
    options: EditorAboveOptions<T> = {}
  ): NodeEntry<T> | undefined {
    let { at = editor.selection,  match, mode = 'lowest' } = options;
    if (!at) {
      return;
    }

    const path = Editor.path(editor, at);
    for (const nodeEntry of Editor.levels(editor, {
      at,
      match,
      reverse: mode === 'lowest',
    })) {
      const [n, p] = nodeEntry;
      if (Text.isText(n)) {
        continue;
      }
      /**
       * 比较极端的情况，比如传入的是 range，用户的 match 只能匹配到 textElement。
       * 那么得到的结果肯定就是 range
       */
      if (Range.isRange(at)) {
        if (Path.isAncestor(p, at.anchor.path) && Path.isAncestor(p, at.focus.path)) {
          return [n, p]
        }
      } else {
        if (!Path.equals(path, p)) {
          return [n, p]
        }
      }
    }
  },

  /**
   * Get the parent node of a location.
   */
  parent(
    editor: Editor,
    at: Location,
    options: EditorParentOptions = {}
  ): NodeEntry<Ancestor> {
    const path = Editor.path(editor, at, options)
    const parentPath = Path.parent(path)
    const entry = Editor.node(editor, parentPath)
    return entry as NodeEntry<Ancestor>
  },

  previous<T extends Node>(
    editor: Editor,
    options: EditorPreviousOptions<T> = {}
  ): NodeEntry<T> | undefined {
    const { at = editor.selection,  mode = 'lowest', voids = false } = options;
    let { match } = options;
    if (!at) {
      return;
    }

    // 1. 找到 beforePoint
    const beforePoint = Editor.before(editor, at);
    if (!beforePoint) {
      return;
    }
    const start =  Editor.start(editor, []);
    // 2. match 默认是 true，path 是 parent.includes(p)
    if (!match) {
      if (Path.isPath(at)) {
        const [parent] = Editor.parent(editor, at);
        // TODO: 使用 includes jest运行会报错...
        match = n => parent.children.indexOf(n) !== -1;
      } else {
        match = () => true;
      }
    }
    // 3 . 遍历从最左边到 beforePoint 的节点，找到符合 match 的节点
    const [prev] = Editor.nodes(editor, {
      at: { anchor: start, focus: beforePoint },
      reverse: true,
      match,
      mode,
      voids
    });

    return prev;
  },

  /**
   * 默认是从 editor 往下到节点，
   * reverse 表示是从 节点往上到 editor
   */
  *levels<T extends Node>(
    editor: Editor,
    options: EditorLevelsOptions<T> = {}
  ): Generator<NodeEntry<T>, void, undefined> {
    let { at = editor.selection, match, reverse = false } = options;
    if (!at) {
      return;
    }

    if (!match) {
      match = () => true
    }

    const levels: NodeEntry<T>[] = [];
    // 获取最底层的 textSlateNode 的 path 
    const path = Editor.path(editor, at);

    for (const [n, p] of Node.levels(editor, path, { reverse })) {
      if (!match(n, p)) {
        continue;
      }
      levels.push([n, p]);
    }

    // 这个是什么语法 跟 yied levels 有什么不同？？
    yield* levels;
  },

  pointRef(
    editor: Editor,
    point: Point,
    options?: PointRefOptions,
  ): PointRef {
    const { affinity = 'forward' } = options || {};
    const ref: PointRef = {
      current: point,
      affinity,
      unref() {
        const { current } = ref
        const pointRefs = Editor.pointRefs(editor)
        pointRefs.delete(ref)
        ref.current = null
        return current
      },
    }

    const refs = Editor.pointRefs(editor)
    refs.add(ref)
    return ref
  },

  /**
   * Get the set of currently tracked point refs of the editor.
   */

  pointRefs(editor: Editor): Set<PointRef> {
    let refs = POINT_REFS.get(editor)

    if (!refs) {
      refs = new Set()
      POINT_REFS.set(editor, refs)
    }

    return refs
  },

  rangeRef(
    editor: Editor,
    range: Range,
    options?: RangeRefOptions,
  ): RangeRef {
    const { affinity = 'forward' } = options || {};
    const ref: RangeRef = {
      current: range,
      affinity,
      unref() {
        const { current } = ref
        const rangeRefs = Editor.rangeRefs(editor)
        rangeRefs.delete(ref)
        ref.current = null
        return current
      },
    }

    const refs = Editor.rangeRefs(editor)
    refs.add(ref)
    return ref
  },

  /**
   * Get the set of currently tracked point refs of the editor.
   */

  rangeRefs(editor: Editor): Set<RangeRef> {
    let refs = RANGE_REFS.get(editor)

    if (!refs) {
      refs = new Set()
      RANGE_REFS.set(editor, refs)
    }

    return refs
  },


  pathRef(
    editor: Editor,
    path: Path,
    options?: PathRefOptions,
  ): PathRef {
    const { affinity = 'forward' } = options || {};
    const ref: PathRef = {
      current: path,
      affinity,
      unref() {
        const { current } = ref
        const pathRefs = Editor.pathRefs(editor)
        pathRefs.delete(ref)
        ref.current = null
        return current
      },
    }

    const refs = Editor.pathRefs(editor)
    refs.add(ref)
    return ref
  },

  /**
   * Get the set of currently tracked point refs of the editor.
   */

  pathRefs(editor: Editor): Set<PathRef> {
    let refs = PATH_REFS.get(editor)

    if (!refs) {
      refs = new Set()
      PATH_REFS.set(editor, refs)
    }

    return refs
  },

  isNormalizing(editor) {
    const isNormalizing = NORMALIZING.get(editor);
    return isNormalizing === undefined ? true : isNormalizing;
  },

  setNormalizing(editor: Editor, isNormalizing: boolean): void {
    NORMALIZING.set(editor, isNormalizing);
  },

  /**
   * 调用 Transform 之后都会调用 normalize 格式化一下文档数据结构。
   * 但是 Transform 中有可能会调用 Transform，这个时候就会造成两次 normalize。
   * 会造成没有必要造成浪费，或者 死循环
   * 
   * withoutNormalizing 作用在于：被其包括的函数，只会调用一次 normalize。
   */
  withoutNormalizing(editor: Editor, fn: () => void): void {
    const value = Editor.isNormalizing(editor);
    Editor.setNormalizing(editor, false);
    try {
      fn();
    } finally {
      Editor.setNormalizing(editor, value);
    }
    Editor.normalize(editor);
  },

  /**
   * 这里有隐藏的死循环的危险，一开始 withoutNormalizing 存储的 value=true，等到调用 normalize 时，此时如果存在 dirtyPath，
   * 那就会不断通过 normalizeNode 消耗掉，会不会存在没有消耗完的场景呢？不是很清楚，但是作者限制了最多只能 while 循环 dirtyPath * 42 次避免死循环
   */
  normalize(editor: Editor): void {
    if (!Editor.isNormalizing(editor)) {
      return;
    }

    const dirtyPath = DIRTY_PATHS.get(editor) || [];    
    const dirtyPathKeys = DIRTY_PATHS_KEYS.get(editor) || new Set();
    let path: Path | undefined = undefined;

    if (dirtyPath.length === 0) {
      return
    }

    Editor.withoutNormalizing(editor, () => {
      // 不断的消耗 dirty_path
      while ((path = dirtyPath.pop())) {
        // 1. 获取 dirtyPath
        const key = path.join(',');
        dirtyPathKeys.delete(key);
        const nodeEntry = Editor.node(editor, path);
  
        editor.normalizeNode(nodeEntry);
      };
    });
  }
}