import { createEditor } from "../../../../src/create-editor";
import { Descendant } from "../../../../src/interfaces/node";
import { Transforms } from "../../../../src/transforms";

const children: Descendant[] = [
  {
    children: [{ text: 'word' }]
  },
];

const output: Descendant[] = [
  {
    children: [
      { children: [{ text: 'word' }]}
    ],
    type: 'a'
  },
]

describe('transfroms.wrapNodes', () => {
  let editor;

  beforeAll(() => {
    editor = createEditor();
    editor.children = children;
    editor.selection = { anchor: { path: [0,0], offset: 0 }, focus: { path: [0,0], offset: 0 } };
  });

  it('block', () => {
    Transforms.wrapNodes(editor, { type: 'a', children: [] });
    expect(editor.children).toStrictEqual(output);
  })
})

