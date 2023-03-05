import { createEditor, Descendant, Editor, Transforms } from '@src/index'

const children: Descendant[] = [
  {
    children: [
      { children: [{ text: 'word' }] },
      { children: [{ text: 'another' }] },
    ],
  },
];

const output: Descendant[] = [
  {
    children: [
      {
        children: [
          { children: [{ text: 'word' }] },
          { children: [{ text: 'another' }] },
        ],
        type: 'a',
      },
    ],
  },
]

describe('transfroms.wrapNodes', () => {
  let editor: Editor;

  beforeAll(() => {
    editor = createEditor();
    editor.children = children;
    editor.selection = { anchor: { path: [0,0,0], offset: 2 }, focus: { path: [0,1,0], offset: 2 } };
  });

  it('block-across-nested', () => {
    Transforms.wrapNodes(editor, { type: 'a', children: [] });
    expect(editor.children).toStrictEqual(output);
    expect(editor.selection).toStrictEqual({ anchor: { path: [0,0,0,0], offset: 2 }, focus: { path: [0,0,1,0], offset: 2 } });
  })
})

