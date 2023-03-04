import { BaseEditor, Editor, Path, Node, Point, Range } from "slate";
import { DOMNode, DOMRange, DOMSelection, DOMStaticRange, isDOMSelection, DOMPoint, isDOMElement, DOMElement } from "../utils/dom";
import { Key } from "../utils/key";
import { EDITOR_TO_ELEMENT, EDITOR_TO_KEY_TO_ELEMENT, EDITOR_TO_WINDOW, ELEMENT_TO_NODE, IS_COMPOSING, IS_FOCUSED, NODE_TO_INDEX, NODE_TO_KEY, NODE_TO_PARENT } from "../utils/weak-map";

export interface ReactEditor extends BaseEditor {
  setFragmentData: (data: DataTransfer) => void;
  insertFragmentData: (data: DataTransfer) => void;
}

// eslint-disable-next-line no-redeclare
export const ReactEditor = {
  isFocused(editor: ReactEditor): boolean {
    return !!IS_FOCUSED.get(editor);
  },

  findKey(editor: ReactEditor, node: Node) {
    let key = NODE_TO_KEY.get(node)

    if (!key) {
      key = new Key()
      NODE_TO_KEY.set(node, key)
    }

    return key
  },
  findPath(editor: ReactEditor, node: Node): Path {
    const path: Path = [];
    let child = node;

    while(true) {
      const parent = NODE_TO_PARENT.get(child);
      if (!parent) {
        if (Editor.isEditor(child)) {
          return path;
        } else {
          break
        }
      }

      const i = NODE_TO_INDEX.get(child);
      if (i === undefined) {
        break
      }
      path.unshift(i);
      child = parent;
    }

    throw new Error(`Unable to find the path for Slate node`);
  },
  /**
   * slateEditor 自己的 window
   */
  getWindow(editor: ReactEditor) {
    const window = EDITOR_TO_WINDOW.get(editor)
    if (!window) {
      throw new Error('Unable to find a host window element for this editor')
    }
    return window
  },

  /**
   * slateNode 节点对应真实 dom 节点
   */
  toDOMNode(editor: ReactEditor, node: Node): HTMLElement {
    const KEY_TO_ELEMENT = EDITOR_TO_KEY_TO_ELEMENT.get(editor);
    const domNode = Editor.isEditor(node) 
      ? EDITOR_TO_ELEMENT.get(editor)
      : KEY_TO_ELEMENT?.get(ReactEditor.findKey(editor, node));
   
    if (!domNode) {
      throw new Error(
        `Cannot resolve a DOM node from Slate node: ${JSON.stringify(node)}`
      )
    }

    return domNode;
  },
  /**
   * dom 节点转换为 slateNode
   */
  toSlateNode(editor: ReactEditor, domNode: DOMNode): Node {
    // 1. 找到 最近的 slateNode 节点对应的 DOM 节点
    let domEl = isDOMElement(domNode) ? domNode : domNode.parentElement;  // text 节点没有 element 的方法，比如 closet
    if (domEl && !domEl.hasAttribute('[data-slate-node]')) {
      domEl = domEl.closest('[data-slate-node]');
    }
    const node = domEl ? ELEMENT_TO_NODE.get(domEl as HTMLElement) : null
    if (!node) {
      throw new Error(`Cannot resolve a Slate node from DOM node: ${domEl}`)
    }
    
    return node
  },
  /**
   * getRootNode：返回当前节点所在文档的根节点
   * ownerDocument： 返回当前节点所在的顶层文档对象
   * 
   * ownerDocument 和 getRootNode 还有不同
   * - 正常情况下 and iframe 都是获取 domElement
   * - 在 shandow 中 
   *    - getRootNode 获取 shandowRoot
   *    - ownerDocument 获取 shandow 外部的 domelemennt
   */
  findDocumentOrShadowRoot(editor: ReactEditor): Document {
    const el = ReactEditor.toDOMNode(editor, editor);
    const root = el.getRootNode();
    
    // shandow 情况下返回 ownerDocument
    if (root instanceof Document) {
      return root;
    }

    return el.ownerDocument;
  },
  /**
   * 判断 editor 中是否存在该 DOM 节点
   */
  hasDOMNode(editor: ReactEditor, target: DOMNode): boolean {
    const editorEl = ReactEditor.toDOMNode(editor, editor);
    let targetEl = isDOMElement(target) ? target : target.parentElement;
    if (!targetEl) {
      return false;
    }
    return targetEl.closest(`[data-slate-editor]`) === editorEl;
  },

  /**
   * 将 DOMRange 转换为 slateRange
   */
  toSlateRange(
    editor: ReactEditor,
    domRange: DOMSelection,
    options: {
      exactMatch: boolean
      suppressThrow: boolean  // 压制错误，不处理错误
    }
  ): Range | null {
    const { exactMatch, suppressThrow } = options
    const el = domRange.anchorNode
    let anchorNode;
    let anchorOffset;
    let focusNode;
    let focusOffset;
    let isCollapsed;
    if (el) {
      anchorNode = domRange.anchorNode;
      anchorOffset = domRange.anchorOffset;
      focusNode = domRange.focusNode;
      focusOffset = domRange.focusOffset;
      isCollapsed = domRange.isCollapsed;
    }

    if (
      anchorNode == null ||
      focusNode == null ||
      anchorOffset == null ||
      focusOffset == null
    ) {
      throw new Error(`Cannot resolve a Slate range from DOM range: ${domRange}`);
    }

    const anchor = ReactEditor.toSlatePoint(
      editor,
      [anchorNode, anchorOffset],
      { exactMatch, suppressThrow }
    );
    if (!anchor) {
      return null;
    }

    const focus = isCollapsed ? anchor : ReactEditor.toSlatePoint(
      editor,
      [focusNode, focusOffset],
      { exactMatch, suppressThrow }
    );
    if (!focus) {
      return null;
    }
  
    const range: Range = { anchor: anchor as Point, focus: focus as Point };
    return range;
  },
  /**
   * 将 slateRange 转换为 DOMRange
   * 因为浏览器限制，无法使用Range.setStart/setEnd创建反向DOM范围。
   * 所以无论正向还是方向，只能创建正向Range，上层根据 isBackword 再去做处理
   */
  toDOMRange(editor: ReactEditor, range: Range): DOMRange {
    const { anchor, focus } = range;
    const isBackword = Range.isBackward(range);

    const domAnchor = ReactEditor.toDOMPoint(editor, anchor);
    const domFocus = Range.isCollapsed(range) ? domAnchor :  ReactEditor.toDOMPoint(editor, focus);
    
    const [startNode, startOffset] = isBackword ? domFocus: domAnchor;
    const [endNode, endOffset] = isBackword ? domAnchor: domFocus;
    
    const window = ReactEditor.getWindow(editor)
    const domRange = window.document.createRange()
    // 这里好像有问题，endOffset 好像一直都是1
    domRange.setStart(startNode, startOffset);
    domRange.setEnd(endNode, endOffset);
    
    return domRange;
  },

  /**
   * 将 DOMPoint 转换为 slatePoint。
   * 
   */
  toSlatePoint(
    editor: ReactEditor,
    dompoint: DOMPoint, 
    options: {
      exactMatch: boolean,    // 精准匹配， domSelection 是 元素是转换为对对应的文本的操作
      suppressThrow: boolean  // 压制错误，不处理错误
    }
  ): Point | null {
    const { suppressThrow } = options || {}
    const [nearestNode, nearestOffset] = dompoint;
    let textNode: DOMElement | null = null
    let offset = 0

    /**
     * slate 逻辑：如果 nearestNode 是 element 那么找到对应的 textNode，但是这个逻辑好像没有地方用。 就是 exactMatch = true
     * 所以这里将 nearestNode 当做 textDOMNode 去处理即可, 因为要做 dom 操作，需要 textDomNode 向上找 parent
     */

    const parentNode = nearestNode.parentElement as DOMElement;
    
    if (parentNode) {
      // 根据 Dompoint 向上找到 leaf 节点
      let leafNode = parentNode.closest('[data-slate-leaf]');
    
      // 如果找不到 leaf，那 Dompoint 应该在落在找到 void 节点
      const editorEl = ReactEditor.toDOMNode(editor, editor);
      const potentialVoidNode = parentNode.closest('[data-slate-void="true"]');
      const voidNode = potentialVoidNode && editorEl.contains(potentialVoidNode) ? potentialVoidNode : null;
  
      if (leafNode) {
        textNode = leafNode.closest('[data-slate-node="text"]');
        if (textNode) {
          /**
           * 注意这路有个坑：对于空节点来说会渲染成 uFEFF 作为占位符，给光标站位置，
           * 但是在 collapse 的情况下， 点击 uFEFF 返回的 domSelection 的 offset 是 1。
           * 这里需要做修正变为 0, 创建一个 range，把 range 中所有空节点都删除
           */
          const range = window.document.createRange();
          range.setStart(textNode, 0);
          range.setEnd(nearestNode, nearestOffset);
          const contents = range.cloneContents();
          const removals = [
            ...Array.prototype.slice.call(
              contents.querySelectorAll('[data-slate-zero-width]')
            ),
          ]
          removals.forEach(el => {
            // COMPAT: While composing at the start of a text node, some keyboards put
            // the text content inside the zero width space.
            el!.parentNode!.removeChild(el)
          })

          offset = contents.textContent!.length;
        }
      } else if (voidNode) {
        // 向下找到 leaf 节点
        const leafNode = voidNode.querySelector('[data-slate-leaf]');
        if (leafNode) {
          textNode = leafNode.closest('[data-slate-node="text"]')!
          offset = leafNode.textContent!.length;
          /**
           * 注意这路有个坑：对于空节点来说会渲染成 uFEFF 作为占位符，给光标站位置，
           * 但是在 collapse 的情况下， 点击 uFEFF 返回的 domSelection 的 offset 是 1。
           * 这里需要做修正变为 0, 将所有空节点删除
           */
          leafNode.querySelectorAll('[data-slate-zero-width]').forEach(el => {
            offset -= el.textContent!.length
          })
        }
      }
    }

    if (!textNode) {
      if (suppressThrow) {
        return null;
      }
      throw new Error(`Cannot resolve a Slate point from DOM point:`)
    }

    const slateNode = ReactEditor.toSlateNode(editor, textNode);
    const path = ReactEditor.findPath(editor, slateNode);
    return { path, offset };
  },

  /**
   * 将 slatePoint 转换为 DOMPoint
   */
  toDOMPoint(editor: ReactEditor, point: Point): DOMPoint {
    const [node, _] = Editor.node(editor, point);
    const el = ReactEditor.toDOMNode(editor, node);

    // data-slate-string 是正常的文本渲染， data-slate-zero-width 是空文本的渲染
    const textParent = el.querySelector('[data-slate-string]') || el.querySelector('[data-slate-zero-width]')
    const text = textParent?.childNodes[0];

    if (!text || text.textContent === null) {
      throw new Error(`Cannot resolve a DOM point from Slate point`)
    }

    // 找到 text 节点
    return [text, point.offset];
  },

  isComposing(editor: ReactEditor): boolean {
    return !!IS_COMPOSING.get(editor);
  },

  hasRange(editor: ReactEditor, range: Range): boolean {
    const { anchor, focus } = range
    return (
      Editor.hasPath(editor, anchor.path) && Editor.hasPath(editor, focus.path)
    )
  },

  setFragmentData(
    editor: ReactEditor,
    data: DataTransfer
  ) {
    editor.setFragmentData(data)
  },

  insertFragmentData(
    editor: ReactEditor,
    data: DataTransfer
  ) {
    editor.insertFragmentData(data)
  }
}