import { createEditor, Descendant, Editor, Transforms, Element } from '@src/index'

const children: Descendant[] = [
  {
    children: [{ text: 'one' }],
  },
  {
    children: [{ text: 'two' }],
  }
];

const output: Descendant[] = [
  {
    children: [{ text: 'two' }],
  },
  {
    children: [{ text: 'one' }],
  }
]

describe('transfroms.moveNodes', () => {
  let editor: Editor;

  beforeAll(() => {
    editor = createEditor();
    editor.children = children;
    editor.selection = { anchor: { path: [0,0], offset: 0 }, focus: {path: [0,0], offset: 0 } };
  });

  it('block', () => {
    Transforms.moveNodes(editor, {
      match: n => Element.isElement(n),
      to: [1],
    });
    expect(editor.children).toStrictEqual(output);
    expect(editor.selection).toStrictEqual({ anchor: { path: [1,0], offset: 0 }, focus: {path: [1,0], offset: 0 } });
  })
})


