import { createEditor, Descendant, Editor, Transforms, Element } from '@src/index'

const children: Descendant[] = [
  {
    children: [{ text: 'one' }],
  },
  {
    children: [{ text: 'two' }],
  },
  {
    children: [{ text: 'three' }],
  }
];

const output: Descendant[] = [
  {
    children: [{ text: 'two' }],
  },
  {
    children: [{ text: 'three' }],
  },
  {
    children: [{ text: 'one' }],
  },
]

describe('transfroms.moveNodes', () => {
  let editor: Editor;

  beforeAll(() => {
    editor = createEditor();
    editor.children = children;
    editor.selection = { anchor: { path: [1,0], offset: 3 }, focus: {path: [2,0], offset: 5 } };
  });

  it('block', () => {
    Transforms.moveNodes(editor, {
      match: n => Element.isElement(n),
      to: [0],
    });
    expect(editor.children).toStrictEqual(output);
    expect(editor.selection).toStrictEqual({ anchor: { path: [0,0], offset: 3 }, focus: {path: [1,0], offset: 5 } });
  })
})


