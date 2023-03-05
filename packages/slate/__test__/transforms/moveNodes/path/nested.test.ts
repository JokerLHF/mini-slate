import { createEditor, Descendant, Editor, Transforms } from '@src/index'

const children: Descendant[] = [
  {
    children: [{
      children: [{ text: 'one' }]
    }],
  },
  {
    children: [{
      children: [{ text: 'two' }]
    }],
  }
];

const output: Descendant[] = [
  { children: [{ text: '' }] },
  {
    children: [
      { children: [{ text: 'one' }] },
      { children: [{ text: 'two' }] },
    ],
  }
]

describe('transfroms.moveNodes', () => {
  let editor: Editor;

  beforeAll(() => {
    editor = createEditor();
    editor.children = children;
  });

  it('block', () => {
    Transforms.moveNodes(editor, { at: [0, 0], to: [1, 0] });
    expect(editor.children).toStrictEqual(output);
  })
})


