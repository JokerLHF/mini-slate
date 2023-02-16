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

  const handleMarkBold = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    Editor.addMark(editor, 'bold', true);
    // Transforms.setNodes(editor, { 'bold': true }, { at: [0, 1] });
  }, [editor]);

  const handleMarkItalic = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    Editor.addMark(editor, 'italic', true);
  }, [editor]);

  const handleSplitNodes = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    Transforms.splitNodes(editor);
  }, [editor]);

  const handleInsertText = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    Transforms.insertText(editor, '测试的');
  }, [editor]);

  const handleRemoveMark = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    Editor.removeMark(editor, 'bold')
  }, [editor]);

  return (
    <Slate editor={editor} value={initialValue}>
      <div onMouseDown={handleMarkBold}>点我加粗</div>
      <div onMouseDown={handleMarkItalic}>点我斜体</div>
      <div onMouseDown={handleSplitNodes}>点我splitNodes</div>
      <div onMouseDown={handleInsertText}>点我 insertText</div>
      <div onMouseDown={handleRemoveMark}>点我 removeMarks</div>

      <Editable
        renderLeaf={renderLeaf}
      />
    </Slate>
  )
}

export default HomePage;