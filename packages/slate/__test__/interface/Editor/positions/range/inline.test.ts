import { createEditor } from '../../../../../src/create-editor'
import { Descendant } from '../../../../../src/interfaces/node'
import { Editor } from '../../../../../src/interfaces/editor'

const children: Descendant[] = [
  {
    children: [
      { text: 'one' },
      {
        children: [{ text: 'two' }]
      },
      { text: 'three' },
      {
        children: [{ text: 'four' }]
      },
      { text: 'five' },
    ]
  },
];

const output = [
  { path: [0, 0], offset: 2 },
  { path: [0, 0], offset: 3 },
  { path: [0, 1, 0], offset: 0 },
  { path: [0, 1, 0], offset: 1 },
  { path: [0, 1, 0], offset: 2 },
  { path: [0, 1, 0], offset: 3 },
  { path: [0, 2], offset: 0 },
  { path: [0, 2], offset: 1 },
  { path: [0, 2], offset: 2 },
  { path: [0, 2], offset: 3 },
  { path: [0, 2], offset: 4 },
  { path: [0, 2], offset: 5 },
  { path: [0, 3, 0], offset: 0 },
  { path: [0, 3, 0], offset: 1 },
  { path: [0, 3, 0], offset: 2 },
  { path: [0, 3, 0], offset: 3 },
  { path: [0, 3, 0], offset: 4 },
  { path: [0, 4], offset: 0 },
  { path: [0, 4], offset: 1 },
  { path: [0, 4], offset: 2 },
]

describe('editor.positions', () => {
  let editor;

  beforeAll(() => {
    editor = createEditor();
    editor.children = children;
  });

  it('positions', () => {
    const res = Array.from(
      Editor.positions(editor, {
        at: {
          anchor: { path: [0, 0], offset: 2 },
          focus: { path: [0, 4], offset: 2 },
        },
      })
    );
    expect(res).toEqual(output);
  })
})
