import { createEditor, Descendant, Editor, Transforms } from '@src/index'

const children: Descendant[] = [
  {
    children: [{ text: 'word' }]
  },
];

const output: Descendant[] = [
  {
    children: [
      { children: [{ text: 'word' }]}
    ],
    type: 'a'
  },
]

describe('transfroms.wrapNodes', () => {
  let editor: Editor;

  beforeAll(() => {
    editor = createEditor();
    editor.children = children;
    editor.selection = { anchor: { path: [0,0], offset: 0 }, focus: { path: [0,0], offset: 0 } };
  });

  it('block', () => {
    Transforms.wrapNodes(editor, { type: 'a', children: [] }, { at: [0] });
    expect(editor.children).toStrictEqual(output);
    editor.selection = { anchor: { path: [0,0, 0], offset: 0 }, focus: { path: [0,0, 0], offset: 0 } };
  })
})

