import { createEditor, Descendant, Editor, Transforms } from '@src/index'

const output: Descendant[] = [
  { children: [{ text: 'one' }]},
  {
    children: [
      { children: [{ text: 'two' }]}
    ],
  },
];

const children: Descendant[] = [
  {
    children: [
      { children: [{ text: 'one' }]},
      { children: [{ text: 'two' }]}
    ],
  },
]

describe('transfroms.liftNodes', () => {
  let editor: Editor;

  beforeAll(() => {
    editor = createEditor();
    editor.children = children;
  });

  it('block', () => {
    Transforms.liftNodes(editor, { at: [0, 0] });
    expect(editor.children).toStrictEqual(output);
  })
})


