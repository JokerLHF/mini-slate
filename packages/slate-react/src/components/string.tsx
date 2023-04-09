import React from 'react'
import { Element, Text, Node } from 'slate'
import { useSlateStatic } from '../hooks/use-slate-static'

/**
 * Leaf content strings.
 */

const String = (props: {
  text: Text,
  leaf: Text,
  parent: Element
}) => {
  const { text, parent, leaf } = props;
  const editor = useSlateStatic();

  if (editor.isVoid(parent)) {
    return <ZeroWidthString length={Node.string(parent).length} />
  }

  /**
   *  {
        type: 'paragraph',
        children: [
          {
            type: 'a',
            children: [{ text: '' }]
          },
          {
            type: 'b',
            text: '111',
          },
        ],
      },

      这种情况下，默认 typeA 不是 isInline，所以渲染 typeA 的时候都会带上 br
      因为 slate 是 view 和 model 分离。即使 a 在 view 上表现是 inline，但是 slate 是 model 驱动 view，
      所以如果没有在 model 定义是 inline，默认就是 block，就需要换行
   */
  if (
    leaf.text === '' &&
    text.text === '' &&
    parent.children[parent.children.length - 1] === text &&
    !editor.isInline(parent)
  ) {
    return <ZeroWidthString isLineBreak />
  }

  /**
   * {
        children: [
          {
            children: [{ text: '111' }]   // 这个 111 被拆分为3个 leaf分别是 【11，‘’，1】
          },
        ],
      },
   */
  if (leaf.text === '') {
    return <ZeroWidthString />
  }

  return <TextString text={leaf.text} />
}

const TextString = (props: { text: string }) => {
  const { text } = props;
  return  <span data-slate-string>{text}</span>
}

/**
 * Leaf strings without text, render as zero-width strings.
 */

 export const ZeroWidthString = (props: {
  length?: number,
  isLineBreak?: boolean
}) => {
  const { length = 0, isLineBreak = false } = props

  const attributes = {
    'data-slate-zero-width': isLineBreak ? 'n' : 'z',
    'data-slate-length': length,
  }

  return (
    <span {...attributes}>
      { isLineBreak ? null : '\uFEFF' }
      { isLineBreak ? <br /> : null }
    </span>
  )
}


export default String
