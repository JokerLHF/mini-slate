import React, { useCallback, useMemo } from 'react'
import { Editable, withReact, Slate, RenderLeafProps, useSlate } from 'slate-react';
import { createEditor, Editor, Descendant, Transforms, Element as SlateElement } from 'slate';
import { withHistory } from 'slate-history';

import { Button, Icon, Toolbar } from '../components'

const initialValue: Descendant[] = [
  {
    children: [
      { children: [{text: '111'}] },
      { children: [{text: '222'}] },
      { children: [{text: '333'}] },
      { children: [{text: '444'}] },
      { children: [{text: '555'}] },
      { children: [
        { children: [
          { children: [{text: '666'}]}
        ]}
      ] },
    ]
  },
]

const Leaf = (props: RenderLeafProps) => {
  let { attributes, children, leaf } = props;

  if (leaf.bold) {
    children = <strong>{children}</strong>
  }

  if (leaf.code) {
    children = <code>{children}</code>
  }

  if (leaf.italic) {
    children = <em>{children}</em>
  }

  if (leaf.underline) {
    children = <u>{children}</u>
  }

  return <span {...attributes}>{children}</span>
}


const Element = ({ attributes, children, element }) => {
  const style = { textAlign: element.align }  
  switch (element.type) {
    case 'block-quote':
      return (
        <blockquote style={style} {...attributes}>
          {children}
        </blockquote>
      )
    case 'bulleted-list':
      return (
        <ul style={style} {...attributes}>
          {children}
        </ul>
      )
    case 'heading-one':
      return (
        <h1 style={style} {...attributes}>
          {children}
        </h1>
      )
    case 'heading-two':
      return (
        <h2 style={style} {...attributes}>
          {children}
        </h2>
      )
    case 'list-item':
      return (
        <li style={style} {...attributes}>
          {children}
        </li>
      )
    case 'numbered-list':
      return (
        <ol style={style} {...attributes}>
          {children}
        </ol>
      )
    case 'div':
      return (
        <div>{children}</div>
    )
    default:
      return (
        <div style={style} {...attributes}>
          {children}
        </div>
      )
  }
}

const MarkButton = ({ format, icon}: { format: string, icon: string }) => {
  const editor = useSlate();
  return (
    <Button
      onMouseDown={event => {
        event.preventDefault()
        toggleMark(editor, format)
      }}
      active={isMarkActive(editor, format)}
    >
      <Icon>{icon}</Icon>
    </Button>
  )
}

const isMarkActive = (editor, format) => {
  const marks = Editor.marks(editor)
  return !!marks[format];
}

const toggleMark = (editor, format) => {
  const isActive = isMarkActive(editor, format);  
  if (isActive) {
    Editor.removeMark(editor, format)
  } else {
    Editor.addMark(editor, format, true)
  }
}

const BlockButton = ({ format, icon }) => {
  const editor = useSlate()
  return (
    <Button
      onMouseDown={event => {
        event.preventDefault()
        toggleBlock(editor, format)
      }}
      active={isBlockActive(
        editor,
        format,
        TEXT_ALIGN_TYPES.includes(format) ? 'align' : 'type'
      )}
    >
      <Icon>{icon}</Icon>
    </Button>
  )
}

const isBlockActive = (editor, format, blockType = 'type') => {
  const { selection } = editor
  if (!selection) return false

  const [match] = Array.from(
    Editor.nodes(editor, {
      at: selection,
      match: n => SlateElement.isElement(n) && n[blockType] === format,
    })
  )

  return !!match;
}

const TEXT_ALIGN_TYPES = ['left', 'center', 'right', 'justify'];
const LIST_TYPES = ['numbered-list', 'bulleted-list'];

const toggleBlock = (editor, format) => {
  const isActive = isBlockActive(
    editor,
    format,
    TEXT_ALIGN_TYPES.includes(format) ? 'align' : 'type'
  );
  const isList = LIST_TYPES.includes(format);

  // 将 LIST_TYPES 节点的子节点展开（上升）
  Transforms.unwrapNodes(editor, {
    match: n => {
      return SlateElement.isElement(n) && LIST_TYPES.includes(n.type) && !TEXT_ALIGN_TYPES.includes(format);
    }
  });

  let newProperties = {};
  if (TEXT_ALIGN_TYPES.includes(format)) {
    newProperties = {
      align: isActive ? undefined : format,
    }
  } else {
    newProperties = {
      type: isActive ? undefined : isList ? 'list-item' : format,
    }
  }
  Transforms.setNodes(editor, newProperties);

  // 创建一个 LIST_TYPES 节点，包括着 list-item
  // list-item 渲染出 li
  // LIST_TYPES 渲染出 ul/ol
  if (!isActive && isList) {
    const block = { type: format, children: [] };
    Transforms.wrapNodes(editor, block);
  }
}


const HomePage = () => {
  const editor = useMemo(() => withHistory(withReact(createEditor())), []);
  const renderLeaf = useCallback(props => <Leaf {...props} />, []);
  const renderElement = useCallback(props => <Element {...props} />, [])

  return (
    <Slate editor={editor} value={initialValue}>
      <Toolbar>
        <MarkButton format="bold" icon="format_bold" />
        <MarkButton format="italic" icon="format_italic" />
        <MarkButton format="underline" icon="format_underlined" />
        <MarkButton format="code" icon="code" />
        <BlockButton format="heading-one" icon="looks_one" />
        <BlockButton format="heading-two" icon="looks_two" />
        <BlockButton format="block-quote" icon="format_quote" />
        <BlockButton format="numbered-list" icon="format_list_numbered" />
        <BlockButton format="bulleted-list" icon="format_list_bulleted" />
        <BlockButton format="left" icon="format_align_left" />
        <BlockButton format="center" icon="format_align_center" />
        <BlockButton format="right" icon="format_align_right" />
        <BlockButton format="justify" icon="format_align_justify" />
      </Toolbar>

      <Editable
        renderLeaf={renderLeaf}
        renderElement={renderElement}
      />
    </Slate>
  )
}

export default HomePage;