import { Descendant, NodeEntry } from "./node";
import { isPlainObject } from 'is-plain-object';
import { Node } from './node';
import { Operation } from "./operation";
import { Range } from './range';
import { Point } from './point';
import { LeafEdge, RangeDirection, TextDirection } from "./types";
import { Path } from "./path";
import { Location } from './location';
import { Text } from "./text";
import { Element } from './element';
import { ExtendedType } from "./custom-types";
import { PointRef } from "./point-ref";
import { DIRTY_PATHS, DIRTY_PATHS_KEYS, NORMALIZING, PATH_REFS, POINT_REFS, RANGE_REFS } from "../utils/weak-maps";
import { RangeRef } from "./range-ref";
import { PathRef } from "./path-ref";

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

export interface EditorPositionsOptions {
  at?: Location,
  reverse?: boolean,
}

export type NodeMatch<T extends Node> =
  | ((node: Node, path: Path) => node is T)
  | ((node: Node, path: Path) => boolean)

export interface EditorLevelsOptions<T extends Node> {
  at?: Location
  match?: NodeMatch<T>
  reverse?: boolean
  voids?: boolean
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

/**
 * slate 本身提供的
 */

export interface BaseEditor {
  children: Descendant[];
  selection: Selection;
  operations: Operation[];
  marks: Record<string, any> | null;

  // Schema-specific node behaviors.
  onChange: () => void;
  isInline: (element: Element) => boolean;
  insertText: (text: string) => void;
  addMark: (key: string, value: any) => void;

  // Overrideable core actions.
  apply: (operation: Operation) => void;
  getDirtyPaths: (op: Operation) => Path[];
  normalizeNode: (entry: NodeEntry) => void;
}

export type Editor = ExtendedType<BaseEditor>;

export interface EditorInterface {
  isEditor: (value: any) => boolean;
  range: (editor: Editor, at: Location, to?: Location) => Range;
  path: (editor: Editor, at: Location, options?: EditorPathOptions) => Path;
  point: (editor: Editor, at: Location, options?: EditorPointOptions) => Point;
  hasPath: (editor: Editor, path: Path) => boolean;
  node: (editor: Editor, at: Location, options?: EditorNodeOptions) => NodeEntry;
  before: (editor: Editor,at: Location) => Point | undefined;
  positions: (editor: Editor, operations?: EditorPositionsOptions) => Generator<Point, void, undefined>;
  addMark: (editor: Editor, key: string, value: any) => void;

  insertText: (editor: Editor, text: string) => void;
  levels: <T extends Node>(
    editor: Editor,
    options?: EditorLevelsOptions<T>
  ) => Generator<NodeEntry<T>, void, undefined>;

  isEdge: (editor: Editor, point: Point, at: Location) => boolean;
  isEnd: (editor: Editor, point: Point, at: Location) => boolean;
  isStart: (editor: Editor, point: Point, at: Location) => boolean;

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
}

export const Editor: EditorInterface = {
  isEditor(value: any) {
    if (!isPlainObject(value)) {
      return false
    }
    // TODO: 其他情况的考虑
    const isEditor = Node.isNodeList(value.children) 
      && typeof value.addMark === 'function'
      && typeof value.onChange === 'function'
      && typeof value.apply === 'function'
      && typeof value.isInline === 'function'
      && typeof value.insertText === 'function'
      && typeof value.getDirtyPaths === 'function'
      && (value.selection === null || Range.isRange(value.selection));
    return isEditor
  },

  getDirtyPaths (op: Operation) {
    return Editor.getDirtyPaths(op);
  },

  isEnd (editor: Editor, point: Point, at: Location): boolean {
    const end =  Editor.point(editor, at, { edge: 'end' });
    return Point.equals(end, point);
  },

  isStart (editor: Editor, point: Point, at: Location): boolean {
    const start =  Editor.point(editor, at, { edge: 'start' });
    return Point.equals(start, point);
  },

  isEdge (editor: Editor, point: Point, at: Location): boolean {
    return Editor.isStart(editor, point, at) || Editor.isEnd(editor, point, at);
  },

  addMark(editor: Editor, key: string, value: any): void {
    editor.addMark(key, value)
  },

  /**
   * 根据 location 中得到 textNode range
   */
  range(editor: Editor, at: Location): Range {
    if (Range.isRange(at)) {
      return at;
    }

    const start = Editor.point(editor, at, { edge: 'start' })
    const end = Editor.point(editor, at, { edge: 'end' })
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
        at = Range.start(at);
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
   * 根据 location 找到 slateTextNode
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
   * 在 at 范围之内，返回所有的 point 节点
   */
  *positions(editor: Editor, options: EditorPositionsOptions = {}): Generator<Point, void, undefined> {
    const { at, reverse = false } = options;
    if (!at) {
      return;
    }

    const first = Editor.path(editor, at, { edge: 'start' });
    const last = Editor.path(editor, at, { edge: 'end' });

    for (const textEntry of Node.texts(editor, { from: first, to: last, reverse })) {
      const [textNode, textNodePath] = textEntry;

      let distance = 0;
      let offset = reverse ? textNode.text.length : 0;

      while(true) {
        if (distance > textNode.text.length) {
          break;
        }

        yield { path: textNodePath, offset }

        reverse ? offset-- : offset++;
        distance++;
      }
    }
  },

  /**
   * 根据 location 返回上一个 point
   */
  before(editor: Editor, at: Location): Point | undefined {
    const distance = 1;
    let d = 0;
    // 从 root 节点最左边的 textPoint
    const anchor = Editor.point(editor, [], { edge: 'start' });
    // 获取从 at 开始最左边的节点
    const focus = Editor.point(editor, at, { edge: 'start' })
    const range = { anchor, focus };
    let target;

    for (const node of Editor.positions(editor, { 
      at: range,
      reverse: true
    })) {
      if (d >= distance) {
        break;
      }

      target = node;
      d++;
    }

    return  target;
  },


  insertText(editor: Editor, text: string) {
    editor.insertText(text);
  },

  *levels<T extends Node>(
    editor: Editor,
    options: EditorLevelsOptions<T> = {}
  ): Generator<NodeEntry<T>, void, undefined> {
    let { at = editor.selection, match } = options;
    if (!at) {
      return;
    }

    if (!match) {
      match = () => true
    }

    const levels: NodeEntry<T>[] = [];
    // 获取最底层的 textSlateNode 的 path 
    const path = Editor.path(editor, at);

    for (const [n, p] of Node.levels(editor, path)) {
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
    const isNormalizing = NORMALIZING.get(editor)
    return isNormalizing === undefined ? true : isNormalizing
  },

  setNormalizing(editor: Editor, isNormalizing: boolean): void {
    NORMALIZING.set(editor, isNormalizing);
  },

  withoutNormalizing(editor: Editor, fn: () => void): void {
    const value = Editor.isNormalizing(editor);
    Editor.setNormalizing(editor, false);
    try {
      fn()
    } finally {
      Editor.setNormalizing(editor, value);
    }
    Editor.normalize(editor);
  },

  normalize(editor: Editor): void {
    if (!Editor.isNormalizing(editor)) {
      return;
    }

    const dirtyPath = DIRTY_PATHS.get(editor) || [];    
    const dirtyPathKeys = DIRTY_PATHS_KEYS.get(editor) || new Set();

    let path: Path | undefined = undefined;
    // 不断的消耗 dirty_path
    while ((path = dirtyPath.pop())) {
      // 1. 获取 dirtyPath
      const key = path.join(',');
      dirtyPathKeys.delete(key);
      const nodeEntry = Editor.node(editor, path);

      editor.normalizeNode(nodeEntry);
    }
  }
}