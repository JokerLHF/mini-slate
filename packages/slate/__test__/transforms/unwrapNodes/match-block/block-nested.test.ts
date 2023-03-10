import { createEditor, Descendant, Editor, Transforms } from '@src/index'

const output: Descendant[] = [
  { 
    children: [
      { children: [{ text: 'word'}]}
    ]
  },
];

const children: Descendant[] = [
  {
    children: [
      { children: [
        { children: [{ text: 'word'}]}
      ]},
    ],
    type: 'a',
  },
]

describe('transfroms.unwrapNodes', () => {
  let editor: Editor;

  beforeAll(() => {
    editor = createEditor();
    editor.children = children;
    editor.selection = { anchor: { path: [0,0,0,0], offset: 0 }, focus: { path: [0,0,0,0], offset: 0 } };
  });

  it('block', () => {
    Transforms.unwrapNodes(editor, { match: n => n.type === 'a' });
    expect(editor.children).toStrictEqual(output);
    expect(editor.selection).toStrictEqual({ anchor: { path: [0,0,0], offset: 0 }, focus: { path: [0,0,0], offset: 0 } });
  })
})

