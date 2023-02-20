import { createEditor } from "../../../../src/create-editor";
import { Descendant } from "../../../../src/interfaces/node";
import { Transforms } from "../../../../src/transforms";

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
    children: [{ text: 'onetwo' }],
  },
  {
    children: [{ text: '' }],
  }
]

describe('transfroms.moveNodes', () => {
  let editor;

  beforeAll(() => {
    editor = createEditor();
    editor.children = children;
  });

  it('block', () => {
    Transforms.moveNodes(editor, { at: [1, 0], to: [0, 1] });
    expect(editor.children).toStrictEqual(output);
  })
})


