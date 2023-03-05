import { createEditor, Descendant, Editor } from '@src/index'

const children: Descendant[] = [
  {
    children: [{ text: 'one' }]
  },
  {
    children: [{ text: 'two' }]
  }
];

const output = [
  { path: [1, 0], offset: 0 },
  { path: [1, 0], offset: 1 },
  { path: [1, 0], offset: 2 },
  { path: [1, 0], offset: 3 },
]

describe('editor.positions', () => {
  let editor: Editor;

  beforeAll(() => {
    editor = createEditor();
    editor.children = children;
  });

  it('position block', () => {
    const res = Array.from(Editor.positions(editor, { at: [1, 0] }));
    expect(res).toStrictEqual(output);
  })
})
