import React, { useRef } from 'react'
import { Element, Text, Node } from 'slate'
import { useIsomorphicLayoutEffect } from '../hooks/use-isomorphic-layout-effect'
import { useSlate } from '../hooks/use-slate'

/**
 * Leaf content strings.
 */

const String = (props: {
  text: Text,
  leaf: Text,
  parent: Element
}) => {
  const { text, parent, leaf } = props;
  const editor = useSlate();

  if (editor.isVoid(parent)) {
    /**
     * 为什么需要获取 parent 所有叶子节点的长度而不是直接使用 props.text 的长度呢？
     * 因为像下面的数据结构，在 element 的判断是 void 节点之后，只会通过 Node.texts(element) 渲染第一个 text 节点，也就是 props.text 就是 { text: '111' }
     *  { type: 'void', children: [
     *     { text: '111' },
     *     { text: '222' }
     *  ] },
     * 
     * Node.string 会去统计 void 所有子节点的长度，上面 case 的就是 6
     * 
     * TODO：目前不知道为什么这样设计
     */
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
    parent.children[parent.children.length - 1] === text &&
    !editor.isInline(parent)
  ) {
    return <ZeroWidthString isLineBreak />
  }

  return <TextString text={leaf.text} />
}

/**
 * Leaf strings with text in them.
 */
const TextString = (props: { text: string }) => {
  const { text } = props;
  const ref = useRef<HTMLSpanElement>(null);

  useIsomorphicLayoutEffect(() => {
    if (ref.current && ref.current.textContent !== text) {
      ref.current.textContent = text;
    }
  })

  // Render text content immediately if it's the first-time render
  // Ensure that text content is rendered on server-side rendering
  if (!ref.current) {
    return (
      <span data-slate-string ref={ref}>{text}</span>
    )
  }

  return <span data-slate-string ref={ref} />
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
      {'\uFEFF'}
      {isLineBreak ? <br /> : null}
    </span>
  )
}


export default String
