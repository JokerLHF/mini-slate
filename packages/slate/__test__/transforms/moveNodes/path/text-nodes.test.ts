import { createEditor, Descendant, Editor, Transforms } from '@src/index'

const children: Descendant[] = [
  {
    children: [{ text: 'bar' }, { text: 'foo'}],
  },
  {
    children: [{ text: 'baz' }],
  }
];

const output: Descendant[] = [
  {
    children: [{ text: 'foo' }],
  },
  {
    children: [{ text: 'barbaz' }],
  }
]

describe('transfroms.moveNodes', () => {
  let editor: Editor;

  beforeAll(() => {
    editor = createEditor();
    editor.children = children;
    editor.selection = { anchor: { path: [1,0], offset: 0 }, focus: {path: [1,0], offset: 0 } };
  });

  it('block', () => {
    Transforms.moveNodes(editor, { at: [0, 0], to: [1, 0] })
    expect(editor.children).toStrictEqual(output);
    editor.selection = { anchor: { path: [1,0], offset: 2 }, focus: {path: [1,0], offset: 2 } };
  })
})


