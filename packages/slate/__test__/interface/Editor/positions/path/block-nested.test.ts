import { createEditor } from '../../../../../src/create-editor'
import { Descendant } from '../../../../../src/interfaces/node'
import { Editor } from '../../../../../src/interfaces/editor'

const children: Descendant[] = [
  {
    children: [
      {
        children: [{ text: 'one' }]
      },
      {
        children: [{ text: 'two' }]
      }
    ]
  }
];

const output = [
  { path: [0, 0, 0], offset: 0 },
  { path: [0, 0, 0], offset: 1 },
  { path: [0, 0, 0], offset: 2 },
  { path: [0, 0, 0], offset: 3 },
  { path: [0, 1, 0], offset: 0 },
  { path: [0, 1, 0], offset: 1 },
  { path: [0, 1, 0], offset: 2 },
  { path: [0, 1, 0], offset: 3 },
]

describe('editor.positions', () => {
  let editor;

  beforeAll(() => {
    editor = createEditor();
    editor.children = children;
  });

  it('positions', () => {
    const res = Array.from(Editor.positions(editor, { at: [0] }))
    expect(res).toStrictEqual(output);
  })
})
