import { Descendant, NodeEntry } from "./node";
import { isPlainObject } from 'is-plain-object';
import { Node } from './node';
import { Operation } from "./operation";
import { Range } from './range';
import { Point } from './point';
import { LeafEdge } from "./types";
import { Path } from "./path";
import { Location } from './location';
import { Text } from "./text";
import { Element } from './element';
import { ExtendedType } from "./custom-types";

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

/**
 * slate 本身提供的
 */

export interface BaseEditor {
  children: Descendant[],
  selection: Selection,
  operations: Operation[],

  // Schema-specific node behaviors.
  isVoid: (value: Element) => boolean,
  onChange: () => void,
  isInline: (element: Element) => boolean,

  // Overrideable core actions.
  apply: (operation: Operation) => void,
}
export type Editor = ExtendedType<BaseEditor>;

export interface EditorInterface {
  isEditor: (value: any) => boolean,
  range: (editor: Editor, at: Location, to?: Location) => Range,
  path: (editor: Editor, at: Location, options?: EditorPathOptions) => Path,
  point: (editor: Editor, at: Location, options?: EditorPointOptions) => Point,
  start: (editor: Editor, at: Location) => Point,
  end: (editor: Editor, at: Location) => Point,
  hasPath: (editor: Editor, path: Path) => boolean,
  node: (editor: Editor, at: Location, options?: EditorNodeOptions) => NodeEntry,
  isVoid: (editor: Editor, value: any) => value is Element,
}

export const Editor: EditorInterface = {
  isEditor(value: any) {
    if (!isPlainObject(value)) {
      return false
    }
    // TODO: 其他情况的考虑
    const isEditor = Node.isNodeList(value.children) 
      && typeof value.onChange === 'function'
      && typeof value.apply === 'function'
      && typeof value.isInline === 'function'
      && typeof value.isVoid === 'function'
      && Operation.isOperationList(value.operations)
      && (value.selection === null || Range.isRange(value.selection));
    return isEditor
  },

  isVoid(editor: Editor, value: any): value is Element {
    return Element.isElement(value) && editor.isVoid(value)
  },

  /**
   * 根据 location 中得到 textNode range
   */
  range(editor: Editor, at: Location): Range {
    if (Range.isRange(at)) {
      return at;
    }

    const start = Editor.start(editor, at)
    const end = Editor.end(editor, at)
    return { anchor: start, focus: end }
  },
  
  /**
   * 从 location 中得到 textNode point
   */
  point(editor: Editor, at: Location, options: EditorPointOptions = {}): Point {
    const { edge } = options;
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
   * 从 location 中获取 textNode path
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

  /**
   * 从 location 获得开始的 textNode point
   */
  start(editor: Editor, at: Location): Point {
    return Editor.point(editor, at, { edge: 'start' });
  },
  /**
   * 从 location 获得结束的 textNode point
   */
  end(editor: Editor, at: Location): Point {
    return Editor.point(editor, at, { edge: 'end' });
  },


  hasPath(editor: Editor, path: Path): boolean {
    return Node.has(editor, path)
  },

  /**
   * 根据 location 找到 slateTextNode slateTextPath
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
}