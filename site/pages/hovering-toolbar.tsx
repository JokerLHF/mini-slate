import React, { useMemo, useRef, useEffect, useState } from 'react'
import { Slate, Editable, withReact, useFocused, useSlateStatic } from 'slate-react'
import {
  Editor,
  Transforms,
  Text,
  createEditor,
  Descendant,
  Range,
} from 'slate'
import { css } from '@emotion/css'
import { withHistory } from 'slate-history'

import { Button, Icon } from '../components'

const HoveringMenuExample = () => {
  const editor = useMemo(() => withHistory(withReact(createEditor())), [])

  return (
    <Slate editor={editor} value={initialValue}>
      <HoveringToolbar />
      <Editable
        renderLeaf={props => <Leaf {...props} />}
        onDOMBeforeInput={(event: InputEvent) => {
          switch (event.inputType) {
            case 'formatBold':
              event.preventDefault()
              return toggleFormat(editor, 'bold')
            case 'formatItalic':
              event.preventDefault()
              return toggleFormat(editor, 'italic')
            case 'formatUnderline':
              event.preventDefault()
              return toggleFormat(editor, 'underlined')
          }
        }}
      />
    </Slate>
  )
}

const toggleFormat = (editor, format) => {
  const isActive = isFormatActive(editor, format)
  Transforms.setNodes(
    editor,
    { [format]: isActive ? null : true },
    { match: Text.isText, split: true }
  )
}
/**
 * 这里不适合使用 editor.marks 因为 editor.marks 即使在扩展的选区也只会返回第一个 element 的 mark
 * 使用 Editor.nodes 遍历所有
 */
const isFormatActive = (editor, format) => {
  const [match] = Editor.nodes(editor, {
    match: n => n[format] === true,
  })
  return !!match;
}

const Leaf = ({ attributes, children, leaf }) => {
  if (leaf.bold) {
    children = <strong>{children}</strong>
  }

  if (leaf.italic) {
    children = <em>{children}</em>
  }

  if (leaf.underlined) {
    children = <u>{children}</u>
  }

  return <span {...attributes}>{children}</span>
}

const HoveringToolbar = () => {
  const ref = useRef<HTMLDivElement | null>(null)
  const editor = useSlateStatic()
  const inFocus = useFocused()
  const [style, setStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    const el = ref.current
    const { selection } = editor

    if (!el) {
      return
    }

    if (
      !selection ||
      !inFocus ||
      Range.isCollapsed(selection)
    ) {
      setStyle({});
      return
    }

    const domSelection = window.getSelection()!;
    // 拿到选区范围的样式
    const domRange = domSelection.getRangeAt(0)
    const rect = domRange.getBoundingClientRect()
    setStyle({
      opacity: 1,
      top: `${rect.top + window.pageYOffset - el.offsetHeight}px`,
      left: `${rect.left + window.pageXOffset -  el.offsetWidth / 2 + rect.width / 2}px`
    })
  }, [editor.selection, inFocus])

  return (
    <div
      ref={ref}
      className={css`
        padding: 8px 7px 6px;
        position: absolute;
        z-index: 1;
        top: -10000px;
        left: -10000px;
        margin-top: -6px;
        opacity: 0;
        background-color: #222;
        border-radius: 4px;
        transition: opacity 0.75s;
      `}
      style={style}
      onMouseDown={e => {
        // prevent toolbar from taking focus away from editor
        e.preventDefault()
      }}
    >
      <FormatButton format="bold" icon="format_bold" />
      <FormatButton format="italic" icon="format_italic" />
      <FormatButton format="underlined" icon="format_underlined" />
    </div>
  )
}

const FormatButton = ({ format, icon }) => {
  const editor = useSlateStatic()
  return (
    <Button
      reversed
      active={isFormatActive(editor, format)}
      onClick={() => toggleFormat(editor, format)}
    >
      <Icon>{icon}</Icon>
    </Button>
  )
}

const initialValue: Descendant[] = [
  {
    type: 'paragraph',
    children: [
      {
        text:
          'This example shows how you can make a hovering menu appear above your content, which you can use to make text ',
      },
      { text: 'bold', bold: true },
      { text: ', ' },
      { text: 'italic', italic: true },
      { text: ', or anything else you might want to do!' },
    ],
  },
  {
    type: 'paragraph',
    children: [
      { text: 'Try it out yourself! Just ' },
      { text: 'select any piece of text and the menu will appear', bold: true },
      { text: '.' },
    ],
  },
]

export default HoveringMenuExample
