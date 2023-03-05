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
    ]
  }
];

const output: Descendant[] = [
  {
    children: [{ text: 'one' }],
  },
  {
    children: [{ text: 'two' }],
  },
  {
    children: [{ text: '' }],
  },
]

describe('transfroms.moveNodes', () => {
  let editor: Editor;

  beforeAll(() => {
    editor = createEditor();
    editor.children = children;
    editor.selection = { anchor: { path: [0,0,0], offset: 0 }, focus: {path: [0,1,0], offset: 3 } };
  });

  it('block', () => {
    Transforms.moveNodes(editor, {
      match: n => Element.isElement(n),
      to: [0],
    });

    expect(editor.children).toStrictEqual(output);
    expect(editor.selection).toEqual({ anchor: { path: [0,0], offset: 0 }, focus: {path: [1,0], offset: 3 } });
  })
})


