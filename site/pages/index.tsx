import React, { useCallback, useEffect, useMemo } from 'react'
import { Editable, withReact, Slate, RenderElementProps, RenderLeafProps } from 'slate-react';
import { createEditor, Element, Editor, Descendant, Text } from 'slate';
import { withHistory } from 'slate-history';

const initialValue: Descendant[] = [
  {
    children: [
      {text: '111222333'},
      // {text: '222'},
      // {text: '333'},
    ]
  },
]


// const handleRenderElement = (props: RenderElementProps) => {
//   const { attributes, children, element } = props
//   switch (element.type) {
//     case 'void':
//       return <EditableVoid {...props} />
//     case 'inline':
//       return (
//         <span {...attributes}>{children}</span>
//       )
//     default:
//       return <div {...attributes}>{children}</div>
//   }
// }

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


const HomePage = () => {
  const editor = useMemo(() => withHistory(withReact(createEditor())), []);
  const renderLeaf = useCallback(props => <Leaf {...props} />, [])

  const handleMark = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    Editor.addMark(editor, 'bold', true);
  }, [editor]);

  // useEffect(() => {
  //   Editor.normalize(editor);
  // }, []);

  return (
    <Slate editor={editor} value={initialValue}>
      <div onMouseDown={handleMark}>点我加粗</div>
      <Editable
        renderLeaf={renderLeaf}
      />
    </Slate>
  )
}

export default HomePage;