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
  { path: [0, 0], offset: 3 },
  { path: [0, 0], offset: 2 },
  { path: [0, 0], offset: 1 },
  { path: [0, 0], offset: 0 },
]

describe('editor.positions', () => {
  let editor: Editor;

  beforeAll(() => {
    editor = createEditor();
    editor.children = children;
  });

  it('positions reverse', () => {
    const res = Array.from(Editor.positions(editor, { reverse: true, at: [0, 0] }));
    expect(res).toStrictEqual(output);
  })
})
