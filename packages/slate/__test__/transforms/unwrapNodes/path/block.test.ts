import { createEditor, Descendant, Editor, Transforms } from '@src/index'

const children: Descendant[] = [
  {
    children: [
      { children: [{ text: 'word' }]}
    ],
  },
];

const output: Descendant[] = [
  {
    children: [{ text: 'word' }]
  },
]

describe('transfroms.unwrapNodes', () => {
  let editor: Editor;

  beforeAll(() => {
    editor = createEditor();
    editor.children = children;
  });

  it('block', () => {
    Transforms.unwrapNodes(editor, { at: [0] });
    expect(editor.children).toStrictEqual(output);
  })
})

