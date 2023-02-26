import { Ancestor, Editor, Node } from "slate";
import { Key } from "./key";

/**
 * 记录 node 的 path 位置的
 */
export const NODE_TO_INDEX: WeakMap<Node, number> = new WeakMap();
export const NODE_TO_PARENT: WeakMap<Node, Ancestor> = new WeakMap();

/**
 * slateNode 和 dom 的一些映射
 */
export const EDITOR_TO_WINDOW: WeakMap<Editor, Window> = new WeakMap();

// Element To Node
export const ELEMENT_TO_NODE: WeakMap<HTMLElement, Node> = new WeakMap();

// Node To Element
export const EDITOR_TO_ELEMENT: WeakMap<Editor, HTMLElement> = new WeakMap();
export const NODE_TO_KEY: WeakMap<Node, Key> = ((globalThis as any).NODE_TO_KEY) = new WeakMap();
export const EDITOR_TO_KEY_TO_ELEMENT: WeakMap<
  Editor,
  WeakMap<Key, HTMLElement>
> = new WeakMap();

export const EDITOR_TO_ON_CHANGE = new WeakMap<Editor, () => void>();

// 中文输入法
export const IS_COMPOSING: WeakMap<Editor, boolean> = new WeakMap();

export const IS_FOCUSED: WeakMap<Editor, boolean> = new WeakMap();