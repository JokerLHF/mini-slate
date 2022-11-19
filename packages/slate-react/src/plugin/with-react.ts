import ReactDOM from "react-dom";
import { BaseEditor, Editor, Operation, Path } from "slate";
import { Key } from "../utils/key";
import { EDITOR_TO_KEY_TO_ELEMENT, EDITOR_TO_ON_CHANGE, NODE_TO_KEY } from "../utils/weak-map";
import { ReactEditor } from "./react-editor";

export const withReact = <T extends BaseEditor>(editor: T): T & ReactEditor=> {
  const e = editor as T & ReactEditor;
  const { apply, onChange } = e

  EDITOR_TO_KEY_TO_ELEMENT.set(e, new WeakMap());

  e.onChange = () => {
    ReactDOM.unstable_batchedUpdates(() => {
      const onContextChange = EDITOR_TO_ON_CHANGE.get(e);
      
      if (onContextChange) {
        onContextChange()
      }
      // 调用 slate 本身的 onChange
      onChange();
    });
  }

  e.apply = (op: Operation) => {
    const matches: [Path, Key][] = [];

    switch (op.type) {
      case 'insert_text': {
        matches.push(...getMatches(e, op.path))
        break;
      }
      default:
        break;
    }

    apply(op);

    /**
     * NODE_TO_KEY 中存放在 slateNode 和 id 的映射。
     * 但是在 insertText 等操作会先修改 model 层再 re-render，
     * re-render 的时候 原来的 slateNode 的值已经改变了。比如 insertText 操作：{ text: 1 } => { text: 12 } 所以在 NODE_TO_KEY 会找不到
     * 所以这里在 apply 之前拿到原来的 slateNode， apply 之后需要重新为【新的 SlateNode】 的值绑定为【原来 slateNode】 的 key
     */

    /**
     * 需要注意的是需要联父节点一起修改了，因为父节点的 children 还是【原来的 slateNode】，
     * apply 之后父节点的 children 还是【新的 slateNode】，此时在 NODE_TO_KEY 会找不到
     * 所以需要往上也一起替换了
     */
    for (const [path, key] of matches) {
      const [node] = Editor.node(e, path)
      NODE_TO_KEY.set(node, key)
    }
  }
  return e;
}

const getMatches = (e: Editor, path: Path) => {
  const matches: [Path, Key][] = []
  for (const [n, p] of Editor.levels(e, { at: path })) {
    const key = ReactEditor.findKey(e, n)
    matches.push([p, key])
  }  
  return matches;
}
