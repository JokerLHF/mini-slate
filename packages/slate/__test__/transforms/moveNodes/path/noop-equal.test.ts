import { createEditor } from "../../../../src/create-editor";
import { Descendant } from "../../../../src/interfaces/node";
import { Transforms } from "../../../../src/transforms";

const children: Descendant[] = [
  {
    children: [{ text: '1' }],
  },
  {
    children: [{ text: '2' }],
  }
];

const output: Descendant[] = [
  {
    children: [{ text: '1' }],
  },
  {
    children: [{ text: '2' }],
  }
]

describe('transfroms.moveNodes', () => {
  let editor;

  beforeAll(() => {
    editor = createEditor();
    editor.children = children;
  });

  it('block', () => {
    Transforms.moveNodes(editor, { at: [1], to: [1] });
    expect(editor.children).toStrictEqual(output);
  })
})


