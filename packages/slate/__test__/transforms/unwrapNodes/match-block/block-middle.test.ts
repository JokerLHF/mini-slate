import { createEditor, Descendant, Editor, Transforms } from '@src/index'

const output: Descendant[] = [
  { children: [{ text: 'one' }]},
  { children: [{ text: 'two' }]},
  { children: [{ text: 'three' }]},
  { children: [{ text: 'five' }]},
  { children: [{ text: 'six' }]},
];

const children: Descendant[] = [
  {
    children: [
      { children: [{ text: 'one' }]},
      { children: [{ text: 'two' }]},
      { children: [{ text: 'three' }]},
      { children: [{ text: 'five' }]},
      { children: [{ text: 'six' }]},
    ],
    type: 'a',
  },
]

describe('transfroms.unwrapNodes', () => {
  let editor: Editor;

  beforeAll(() => {
    editor = createEditor();
    editor.children = children;
    editor.selection = { anchor: { path: [0,2,0], offset: 0 }, focus: { path: [0,3,0], offset: 0 } };
  });

  it('block', () => {
    Transforms.unwrapNodes(editor, { match: n => n.type === 'a' });
    expect(editor.children).toStrictEqual(output);
    expect(editor.selection).toStrictEqual({ anchor: { path: [2,0], offset: 0 }, focus: { path: [3,0], offset: 0 } });
  })
})

