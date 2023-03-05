import { createEditor, Descendant, Editor, Element } from '@src/index'

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
  let editor: Editor;

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
