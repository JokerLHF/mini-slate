import { createEditor, Descendant, Editor, Transforms } from '@src/index'

const output: Descendant[] = [
  {
    children: [
      { children: [{ text: 'one' }]},
    ],
  },
  { children: [{ text: 'two' }]},
  {
    children: [
      { children: [{ text: 'three' }]},
    ]
  }
];

const children: Descendant[] = [
  {
    children: [
      { children: [{ text: 'one' }]},
      { children: [{ text: 'two' }]},
      { children: [{ text: 'three' }]},
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
    Transforms.liftNodes(editor, { at: [0, 1] });
    expect(editor.children).toStrictEqual(output);
  })
})


