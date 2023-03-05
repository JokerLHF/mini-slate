import { createEditor, Descendant, Editor, Transforms, Element } from '@src/index'

const children: Descendant[] = [
  {
    children: [
      {
        children: [{ text: 'one' }],
      },
      {
        children: [{ text: 'two' }],
      },
      {
        children: [{ text: 'three' }],
      },
    ]
  }
];

const output: Descendant[] = [
  {
    children: [
      { children: [{ text: 'one' }]}
    ],
  },
  {
    children: [{ text: 'two' }],
  },
  {
    children: [{ text: 'three' }],
  },
]

describe('transfroms.moveNodes', () => {
  let editor: Editor;

  beforeAll(() => {
    editor = createEditor();
    editor.children = children;
    editor.selection = { anchor: { path: [0,1,0], offset: 0 }, focus: {path: [0,2,0], offset: 5 } };
  });

  it('block', () => {
    Transforms.moveNodes(editor, {
      match: n => Element.isElement(n),
      to: [1],
    });
    expect(editor.children).toEqual(output);
    expect(editor.selection).toEqual({ anchor: { path: [1,0], offset: 0 }, focus: {path: [2,0], offset: 5 } });
  })
})


