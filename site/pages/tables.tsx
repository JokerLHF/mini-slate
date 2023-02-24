import React, { useCallback, useMemo } from 'react'
import { Slate, Editable, withReact, RenderLeafProps } from 'slate-react'
import {
  Editor,
  Range,
  Point,
  Descendant,
  createEditor,
  Element as SlateElement,
} from 'slate'
import { withHistory } from 'slate-history'

const TablesExample = () => {
  const renderElement = useCallback(props => <Element {...props} />, [])
  const renderLeaf = useCallback(props => <Leaf {...props} />, [])
  const editor = useMemo(() => {
    return withTables(withHistory(withReact(createEditor())))
  }, []);

  return (
    <Slate editor={editor} value={initialValue}>
      <Editable renderElement={renderElement} renderLeaf={renderLeaf} />
    </Slate>
  )
}

const withTables = editor => {
  const { deleteBackward, deleteFragment } = editor;

  // TODO：如何做到整体删除 table？？
  editor.deleteBackward = () => {
    const { selection } = editor;
    if (selection && Range.isCollapsed(selection)) {
      const [cell] = Editor.nodes(editor, {
        match: n => SlateElement.isElement(n) && n.type === 'table-cell',
      });

      if (cell) {
        const [, cellPath] = cell;
        // 当t ableCell 子节点没有数据并且想要删除的时候不允许，因为这样相当于删除 tableCell 了
        const start = Editor.start(editor, cellPath);
        if (Point.equals(selection.anchor, start)) {
          return
        }
      }
    }
    deleteBackward()
  };

  editor.deleteFragment = () => {
    const { selection } = editor;

    if (selection && !Range.isCollapsed(selection)) {
      // TODO：Table 如何保持列不删除呢？
    }
    deleteFragment();
  }

  return editor;
}

const Element = ({ attributes, children, element }) => {
  switch (element.type) {
    case 'table':
      return (
        <table>
          <tbody {...attributes}>{children}</tbody>
        </table>
      )
    case 'table-row':
      return <tr {...attributes}>{children}</tr>
    case 'table-cell':
      return <td {...attributes}>{children}</td>
    default:
      return <p {...attributes}>{children}</p>
  }
}

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
const initialValue: Descendant[] = [
  {
    type: 'paragraph',
    children: [
      {
        text:
          'Since the editor is based on a recursive tree model, similar to an HTML document, you can create complex nested structures, like tables:',
      },
    ],
  },
  {
    type: 'table',
    children: [
      {
        type: 'table-row',
        children: [
          {
            type: 'table-cell',
            children: [{ text: '' }],
          },
          {
            type: 'table-cell',
            children: [{ text: 'Human', bold: true }],
          },
          {
            type: 'table-cell',
            children: [{ text: 'Dog', bold: true }],
          },
          {
            type: 'table-cell',
            children: [{ text: 'Cat', bold: true }],
          },
        ],
      },
      {
        type: 'table-row',
        children: [
          {
            type: 'table-cell',
            children: [{ text: '# of Feet', bold: true }],
          },
          {
            type: 'table-cell',
            children: [{ text: '2' }],
          },
          {
            type: 'table-cell',
            children: [{ text: '4' }],
          },
          {
            type: 'table-cell',
            children: [{ text: '4' }],
          },
        ],
      },
      {
        type: 'table-row',
        children: [
          {
            type: 'table-cell',
            children: [{ text: '# of Lives', bold: true }],
          },
          {
            type: 'table-cell',
            children: [{ text: '1' }],
          },
          {
            type: 'table-cell',
            children: [{ text: '1' }],
          },
          {
            type: 'table-cell',
            children: [{ text: '9' }],
          },
        ],
      },
    ],
  },
  {
    type: 'paragraph',
    children: [
      {
        text:
          "This table is just a basic example of rendering a table, and it doesn't have fancy functionality. But you could augment it to add support for navigating with arrow keys, displaying table headers, adding column and rows, or even formulas if you wanted to get really crazy!",
      },
    ],
  },
]

export default TablesExample
