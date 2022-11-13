import React, { useCallback, useMemo } from 'react'
import { Editable, withReact, Slate, RenderElementProps } from 'slate-react';
import { createEditor, Element, Editor, Descendant, Text } from 'slate';

const initialValue: Descendant[] = [
  {
    children: [
      { type: 'void', children: [
        { text: '111' },
        {text: '222'}
      ] },
      { type: 'no-inline', children: [{text: ''}] },
      { type: 'inline', children: [{text: '333'}] },
      // { type: 'test', children: [{text: 'abcd'}] },
    ]
  },
]

const widthVoid = (editor: Editor) => {
  const { isVoid, isInline } = editor;

  editor.isVoid = (element: Element) => {
    return element.type === 'void' ? true : isVoid(element);
  }
  editor.isInline = (element: Element) => {
    return element.type === 'inline' ? true : isInline(element);
  } 
  (globalThis as any).editor = editor
  return editor;
}

const handleRenderElement = (props: RenderElementProps) => {
  const { attributes, children, element } = props
  switch (element.type) {
    case 'void':
      return <EditableVoid {...props} />
    case 'inline':
      return (
        <span {...attributes}>{children}</span>
      )
    default:
      return <div {...attributes}>{children}</div>
  }
}

const EditableVoid = ({ attributes, children, element }) => {
  return (
    <div {...attributes}>
      {children}
      <div contentEditable={false}>
        <img src="https://avatars.githubusercontent.com/u/40337000?v=4" />
      </div>
    </div>
  )
}
const HomePage = () => {
  const editor = useMemo(() => widthVoid(withReact(createEditor())), [])
  // const decorate = useCallback(([node, path]) => {

  //   if (!Text.isText(node)) {
  //     return [];
  //   }
  //   // 用的是 middle 的测试用例
  //   return [
  //     {
  //       anchor: {
  //         path: [0],
  //         offset: 1,
  //       },
  //       focus: {
  //         path: [0],
  //         offset: 2,
  //       },
  //       decoration1: 'decoration1',
  //     },
  //     {
  //       anchor: {
  //         path: [0],
  //         offset: 2,
  //       },
  //       focus: {
  //         path: [0],
  //         offset: 2,
  //       },
  //       decoration2: 'decoration2',
  //     },
  //     {
  //       anchor: {
  //         path: [0],
  //         offset: 2,
  //       },
  //       focus: {
  //         path: [0],
  //         offset: 3,
  //       },
  //       decoration3: 'decoration3',
  //     },
  //     {
  //       anchor: {
  //         path: [0],
  //         offset: 4,
  //       },
  //       focus: {
  //         path: [0],
  //         offset: 4,
  //       },
  //       decoration4: 'decoration4',
  //     },
  //   ]
  // }, [])

  return (
    <Slate editor={editor} value={initialValue}>
      <Editable
        renderElement={handleRenderElement}
        // decorate={decorate}
      />
    </Slate>
  )
}

export default HomePage;