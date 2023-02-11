import React, { useCallback, useMemo } from 'react'
import { Editable, withReact, Slate, RenderLeafProps } from 'slate-react';
import { createEditor, Editor, Descendant, Transforms } from 'slate';
import { withHistory } from 'slate-history';

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

  const handleSplitNodes = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    Transforms.splitNodes(editor);
  }, [editor]);

  const handleInsertText = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    Transforms.insertText(editor, '测试的');
  }, [editor]);

  return (
    <Slate editor={editor} value={initialValue}>
      <div onMouseDown={handleMark}>点我加粗</div>
      <div onMouseDown={handleSplitNodes}>点我splitNodes</div>
      <div onMouseDown={handleInsertText}>点我 insertText</div>
      <Editable
        renderLeaf={renderLeaf}
      />
    </Slate>
  )
}

export default HomePage;