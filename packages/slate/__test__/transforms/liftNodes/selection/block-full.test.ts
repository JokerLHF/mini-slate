import { createEditor, Descendant, Editor, Transforms } from '@src/index'

const output: Descendant[] = [
  { children: [{ text: 'one' }]},
  { children: [{ text: 'two' }]},
  { children: [{ text: 'three' }]},
  { children: [{ text: 'four' }]},
  { children: [{ text: 'five' }]},
  { children: [{ text: 'six' }]},
];

const children: Descendant[] = [
  {
    children: [
      { children: [{ text: 'one' }]},
      { children: [{ text: 'two' }]},
      { children: [{ text: 'three' }]},
      { children: [{ text: 'four' }]},
      { children: [{ text: 'five' }]},
      { children: [{ text: 'six' }]},
    ],
  },
]

describe('transfroms.liftNodes', () => {
  let editor: Editor;

  beforeAll(() => {
    editor = createEditor();
    editor.children = children;
    editor.selection = { anchor: { path: [0,0,0], offset: 0 }, focus: { path: [0,5,0], offset: 0 } };
  });

  it('block', () => {
    Transforms.liftNodes(editor);
    expect(editor.children).toStrictEqual(output);
    expect(editor.selection).toStrictEqual({ anchor: { path: [0,0], offset: 0 }, focus: { path: [5,0], offset: 0 } });
  })
})


