import { createEditor, Descendant, Editor, Element } from '@src/index'

const children: Descendant[] = [
  {
    children: [
      { children: [
        { children: [{text: 'one'}] }
      ]},
      { children: [{ text: 'two' }]}
    ]
  }
];

const output = [
  {
    children: [
      { children: [
        { children: [{text: 'one'}] }
      ]},
      { children: [{ text: 'two' }]}
    ]
  },
  [0]
]

const range = {
  anchor: { offset: 0, path: [0, 0, 0, 0] },
  focus: { offset: 0, path: [0, 1, 0] },
}

describe('editor.above', () => {
  let editor: Editor;

  beforeAll(() => {
    editor = createEditor();
    editor.children = children;
  });

  it('above', () => {
    const res = Editor.above(editor, {
      at: range,
      match: n => Element.isElement(n) && Editor.isBlock(editor, n),
    })
    expect(res).toEqual(output);
  })
})
