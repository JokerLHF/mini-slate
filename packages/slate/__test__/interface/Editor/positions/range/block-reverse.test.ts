import { createEditor, Descendant, Editor } from '@src/index'

const children: Descendant[] = [
  {
    children: [{ text: 'one' }]
  },
  {
    children: [{ text: 'two' }]
  },
  {
    children: [{ text: 'three' }]
  }
];

const output = [
  { path: [2, 0], offset: 2 },
  { path: [2, 0], offset: 1 },
  { path: [2, 0], offset: 0 },
  { path: [1, 0], offset: 3 },
  { path: [1, 0], offset: 2 },
  { path: [1, 0], offset: 1 },
  { path: [1, 0], offset: 0 },
  { path: [0, 0], offset: 3 },
  { path: [0, 0], offset: 2 },
  { path: [0, 0], offset: 1 },
]

describe('editor.positions', () => {
  let editor: Editor;

  beforeAll(() => {
    editor = createEditor();
    editor.children = children;
  });

  it('positions', () => {
    const res = Array.from(
      Editor.positions(editor, {
        reverse: true,
        at: {
          anchor: { path: [0, 0], offset: 1 },
          focus: { path: [2, 0], offset: 2 },
        },
      })
    )
    expect(res).toEqual(output);
  })
})
