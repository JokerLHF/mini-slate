import { createEditor, Descendant, Editor, Transforms } from '@src/index'

const children: Descendant[] = [
  {
    children: [{ text: 'one' }]
  },
  { 
    children: [
      { children: [{ text: 'two' }] },
    ]
  }
];

const output: Descendant[] = [
  { 
    children: [
      { children: [{ text: 'two' }] },
      { children: [{ text: 'one' }] },
    ]
  }
]

describe('transfroms.moveNodes', () => {
  let editor: Editor;

  beforeAll(() => {
    editor = createEditor();
    editor.children = children;
    editor.selection = { anchor: { path: [0,0], offset: 0 }, focus: {path: [0,0], offset: 0 } };
  });

  it('block', () => {
    Transforms.moveNodes(editor, { at: [0], to: [1, 1] });
    expect(editor.children).toStrictEqual(output);
    expect(editor.selection).toStrictEqual({ anchor: { path: [0,1,0], offset: 0 }, focus: {path: [0,1,0], offset: 0 } })
  })
})


