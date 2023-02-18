import { createEditor } from "../../../../src/create-editor";
import { Descendant } from "../../../../src/interfaces/node";
import { Transforms } from "../../../../src/transforms";

const output: Descendant[] = [
  { children: [{ text: 'one' }]},
  { children: [{ text: 'two' }]},
  { children: [{ text: 'three' }]},
  { children: [{ text: 'five' }]},
  { children: [{ text: 'six' }]},
];

const children: Descendant[] = [
  {
    children: [
      { children: [{ text: 'one' }]},
      { children: [{ text: 'two' }]},
      { children: [{ text: 'three' }]},
      { children: [{ text: 'five' }]},
      { children: [{ text: 'six' }]},
    ],
    type: 'a',
  },
]

describe('transfroms.unwrapNodes', () => {
  let editor;

  beforeAll(() => {
    editor = createEditor();
    editor.children = children;
    editor.selection = { anchor: { path: [0,3,0], offset: 0 }, focus: { path: [0,4,0], offset: 0 } };
  });

  it('block', () => {
    Transforms.unwrapNodes(editor, { match: n => n.type === 'a' });
    expect(editor.children).toStrictEqual(output);
    expect(editor.selection).toStrictEqual({ anchor: { path: [3,0], offset: 0 }, focus: { path: [4,0], offset: 0 } });
  })
})

