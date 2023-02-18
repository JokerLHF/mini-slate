import { createEditor } from "../../../../src/create-editor";
import { Descendant } from "../../../../src/interfaces/node";
import { Transforms } from "../../../../src/transforms";

const children: Descendant[] = [
  {
    children: [
      { children: [{ text: 'word' }]}
    ],
    type: 'a',
  },
];

const output: Descendant[] = [
  {
    children: [{ text: 'word' }]
  },
]

describe('transfroms.unwrapNodes', () => {
  let editor;

  beforeAll(() => {
    editor = createEditor();
    editor.children = children;
    editor.selection = { anchor: { path: [0,0,0], offset: 0 }, focus: { path: [0,0,0], offset: 0 } };
  });

  it('block', () => {
    Transforms.unwrapNodes(editor, { match: n => n.type === 'a' });
    expect(editor.children).toStrictEqual(output);
    expect(editor.selection).toStrictEqual({ anchor: { path: [0,0], offset: 0 }, focus: { path: [0,0], offset: 0 } });
  })
})

