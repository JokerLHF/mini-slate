import { createEditor } from '../../../../src/create-editor'
import { Descendant } from '../../../../src/interfaces/node'
import { Editor } from '../../../../src/interfaces/editor'
import { Element } from '../../../../src/interfaces/element'


const children: Descendant[] = [
  {
    children: [
      {
        children: [{ text: 'one' }]
      },
    ]
  }
];

const output = [
  {
    children: [
      {
        children: [{ text: 'one' }]
      },
    ]
  },
  [0]
]

describe('editor.above', () => {
  let editor;

  beforeAll(() => {
    editor = createEditor();
    editor.children = children;
  });

  it('above', () => {
    const res = Editor.above(editor, {
      at: [0, 0, 0],
      match: n => Element.isElement(n) && Editor.isBlock(editor, n),
      mode: 'highest',
    })
    expect(res).toEqual(output);
  })
})
