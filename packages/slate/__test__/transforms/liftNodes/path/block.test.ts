import { createEditor } from "../../../../src/create-editor";
import { Descendant } from "../../../../src/interfaces/node";
import { Transforms } from "../../../../src/transforms";

const output: Descendant[] = [
  {
    children: [{ text: 'word' }]
  },
];

const children: Descendant[] = [
  {
    children: [
      { children: [{ text: 'word' }]}
    ],
  },
]

describe('transfroms.liftNodes', () => {
  let editor;

  beforeAll(() => {
    editor = createEditor();
    editor.children = children;
  });

  it('block', () => {
    Transforms.liftNodes(editor, { at: [0, 0] })
    expect(editor.children).toStrictEqual(output);
  })
})


