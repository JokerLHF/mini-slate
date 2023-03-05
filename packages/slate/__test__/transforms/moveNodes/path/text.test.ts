import { createEditor, Descendant, Editor, Transforms } from '@src/index'

const children: Descendant[] = [
  {
    children: [{ text: 'one' }],
  },
  {
    children: [{ text: 'two' }],
  }
];

const output: Descendant[] = [
  {
    children: [{ text: 'onetwo' }],
  },
  {
    children: [{ text: '' }],
  }
]

describe('transfroms.moveNodes', () => {
  let editor: Editor;

  beforeAll(() => {
    editor = createEditor();
    editor.children = children;
  });

  it('block', () => {
    Transforms.moveNodes(editor, { at: [1, 0], to: [0, 1] });
    expect(editor.children).toStrictEqual(output);
  })
})


