import { createEditor } from '../../../../src/create-editor'
import { Descendant } from '../../../../src/interfaces/node'
import { BaseEditor, Editor } from '../../../../src/interfaces/editor'
import { Element } from '../../../../src/interfaces/element'

const children: Descendant[] = [
  {
    children: [
      { text: 'one' },
      { children: [{text: 'two'}], type: 'inline' },
      { text: 'three' },
    ]
  }
];

const output = [
  { children: [{text: 'two'}], type: 'inline' },
  [0, 1]
]

describe('editor.above', () => {
  let editor: BaseEditor;

  beforeAll(() => {
    editor = createEditor();
    editor.children = children;

    const { isInline } = editor;
    editor.isInline = element => {
      return element.type === 'inline' ? true : isInline(element)
    }
  });

  it('above', () => {
    const res =  Editor.above(editor, {
      at: [0, 1, 0],
      match: n => Element.isElement(n) && Editor.isInline(editor, n),
    })
    expect(res).toEqual(output);
  })
})
