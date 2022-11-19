import React from 'react'
import { Element, Text } from 'slate'
import String from './string'
import { RenderLeafProps } from './editable'

/**
 * Individual leaves in a text node with unique formatting.
 */

const Leaf = (props: {
  renderLeaf?: (props: RenderLeafProps) => JSX.Element
  text: Text,
  leaf: Text,
  parent: Element
}) => {
  const {
    text,
    parent,
    leaf,
    renderLeaf = (props: RenderLeafProps) => <DefaultLeaf {...props} />,
  } = props;

  let children = (
    <String text={text} leaf={leaf} parent={parent} />
  );

  const attributes: {
    'data-slate-leaf': true
  } = {
    'data-slate-leaf': true,
  }

  return renderLeaf({ attributes, children, text })
}

const MemoizedLeaf = React.memo(Leaf, (prev, next) => {
  // debugger
  const isMemoizedLeaf = (
    next.parent === prev.parent &&
    next.renderLeaf === prev.renderLeaf &&
    next.text === prev.text
    // Text.equals(next.leaf, prev.leaf) &&
  );

  return isMemoizedLeaf;
})

export const DefaultLeaf = (props: RenderLeafProps) => {
  const { attributes, children } = props
  return <span {...attributes}>{children}</span>
}

export default MemoizedLeaf
