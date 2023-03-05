import { createEditor, Descendant, Editor, Transforms } from '@src/index'

const output: Descendant[] = [
  { children: [{ text: 'word' }]},
  { children: [{ text: 'another' }]},
];

const children: Descendant[] = [
  {
    children: [
      { children: [{ text: 'word' }]},
      { children: [{ text: 'another' }]},
    ],
    type: 'a',
  },
]

describe('transfroms.unwrapNodes', () => {
  let editor: Editor;

  beforeAll(() => {
    editor = createEditor();
    editor.children = children;
    editor.selection = { anchor: { path: [0,0,0], offset: 2 }, focus: { path: [0,1,0], offset: 2 } };
  });

  it('block', () => {
    Transforms.unwrapNodes(editor, { match: n => n.type === 'a' });
    expect(editor.children).toStrictEqual(output);
    expect(editor.selection).toStrictEqual({ anchor: { path: [0,0], offset: 2 }, focus: { path: [1,0], offset: 2 } });
  })
})

