import { createEditor, Descendant, Editor, Transforms } from '@src/index'

const children: Descendant[] = [
  {
    children: [
      { children: [{ text: 'one' }]},
      { children: [{ text: 'two' }]}
    ],
  },
];

const output: Descendant[] = [
  { children: [{ text: 'one' }]},
  { children: [{ text: 'two' }]}
]

describe('transfroms.unwrapNodes', () => {
  let editor: Editor;

  beforeAll(() => {
    editor = createEditor();
    editor.children = children;
  });

  it('block-multiple', () => {
    Transforms.unwrapNodes(editor, { at: [0] });
    expect(editor.children).toStrictEqual(output);
  })
})

