import { createEditor, Descendant, Editor, Transforms } from '@src/index'

const children: Descendant[] = [
  {
    children: [{ 
      children: [{ text: 'word' }],
      type: 'b'
    }],
    type: 'a',
  },
];

const output: Descendant[] = [
  {
    children: [{
      children: [{
        children: [{ text: 'word' }],
        type: 'b'
      }],
      type: 'new',
    }],
    type: 'a',
  },
]

describe('transfroms.wrapNodes', () => {
  let editor: Editor;

  beforeAll(() => {
    editor = createEditor();
    editor.children = children;
    editor.selection = { anchor: { path: [0,0], offset: 0 }, focus: { path: [0,0], offset: 0 } };
  });

  it('block-nested', () => {
    Transforms.wrapNodes(editor, { type: 'new', children: [] });
    expect(editor.children).toStrictEqual(output);
    expect(editor.selection).toStrictEqual({ anchor: { path: [0,0,0], offset: 0 }, focus: { path: [0,0,0], offset: 0 } });
  })
})

