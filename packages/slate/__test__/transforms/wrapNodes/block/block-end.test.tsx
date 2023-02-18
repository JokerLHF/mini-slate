import { createEditor } from "../../../../src/create-editor";
import { Descendant } from "../../../../src/interfaces/node";
import { Transforms } from "../../../../src/transforms";

const children: Descendant[] = [
  {
    children: [{ text: 'one' }],
  },
  {
    children: [{ text: 'two' }],
  },
  {
    children: [{ text: 'three' }],
  },
];

const output: Descendant[] = [
  {
    children: [{ text: 'one' }],
  },
  {
    children: [
      { children: [{ text: 'two' }] },
      { children: [{ text: 'three' }] },
    ],
    type: 'a',
  }
]

describe('transfroms.wrapNodes', () => {
  let editor;

  beforeAll(() => {
    editor = createEditor();
    editor.children = children;
    editor.selection = { anchor: { path: [1,0], offset: 0 }, focus: { path: [2,0], offset: 5 } };
  });

  it('block-end', () => {
    Transforms.wrapNodes(editor, { type: 'a', children: [] });
    expect(editor.children).toStrictEqual(output);
    expect(editor.selection).toStrictEqual({ anchor: { path: [1,0,0], offset: 0 }, focus: { path: [1,1,0], offset: 5 } });
  })
})

