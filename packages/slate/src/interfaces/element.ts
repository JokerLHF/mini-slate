import { Descendant } from "./node";
import { isPlainObject } from 'is-plain-object';
import { Node } from './node';
import { Editor } from "./editor";
import { ExtendedType } from "./custom-types";

export interface BaseElement {
  children: Descendant[],
}

export type Element = ExtendedType<BaseElement>;

/**
 * slate 本身提供的
 */

export interface ElementInterface {
  isElement: (value: any) => value is Element
}

export const Element: ElementInterface = {
  isElement(value: any): value is Element {
    return (
      isPlainObject(value)
      && Node.isNodeList(value.children)
      && !Editor.isEditor(value)
    )
  }
}


/*
 * 上面 isElement 同名导出，使用有疑惑？看下面：
 * https://stackoverflow.com/questions/60449736/how-to-import-two-exports-with-the-same-name-from-the-same-file
 */