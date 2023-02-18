import { createEditor } from "../../../../src/create-editor";
import { Descendant } from "../../../../src/interfaces/node";
import { Transforms } from "../../../../src/transforms";

const children: Descendant[] = [
  {
    children: [
      { children: [{ text: 'word' }]}
    ],
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
  });

  it('block', () => {
    Transforms.unwrapNodes(editor, { at: [0] });
    expect(editor.children).toStrictEqual(output);
  })
})

