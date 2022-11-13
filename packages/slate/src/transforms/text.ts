import { Editor } from "../interfaces/editor";
import { Location } from '../interfaces/location';
import { Path } from "../interfaces/path";
import { Range } from "../interfaces/range";

export interface TextTransforms {
  insertText: (editor: Editor, text: string) => void;
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
  }
}
