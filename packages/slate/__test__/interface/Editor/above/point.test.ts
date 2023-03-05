import { createEditor, Descendant, Editor } from '@src/index'

const children: Descendant[] = [
  {
    children: [
      { children: [{text: 'one'}] },
    ]
  }
];

const output = [
  { children: [{text: 'one'}] },
  [0, 0]
]

describe('editor.above', () => {
  let editor: Editor;

  beforeAll(() => {
    editor = createEditor();
    editor.children = children;
  });

  it('above', () => {
    const res = Editor.above(editor, { at: { path: [0, 0, 0], offset: 1 } })
    expect(res).toEqual(output);
  })
})
