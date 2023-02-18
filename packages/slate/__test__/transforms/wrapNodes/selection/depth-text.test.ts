import { createEditor } from "../../../../src/create-editor";
import { Descendant } from "../../../../src/interfaces/node";
import { Transforms } from "../../../../src/transforms";

const children: Descendant[] = [
  {
    children: [{ text: 'world' }]
  },
];

const output: Descendant[] = [
  {
    children: [
      { children: [{ text: 'world' }]}
    ],
    type: 'test'
  },
]

describe('transfroms.wrapNodes', () => {
  let editor;

  beforeAll(() => {
    editor = createEditor();
    editor.children = children;
    editor.selection = { anchor: { path: [0,0], offset: 0 }, focus: {path: [0,0], offset: 5 } };
  });

  it('selection', () => {
    Transforms.wrapNodes(editor, { type: 'test', children: [] });
    expect(editor.children).toStrictEqual(output);
  })
})
