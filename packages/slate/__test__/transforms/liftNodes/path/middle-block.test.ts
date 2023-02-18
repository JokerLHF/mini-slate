import { createEditor } from "../../../../src/create-editor";
import { Descendant } from "../../../../src/interfaces/node";
import { Transforms } from "../../../../src/transforms";

const output: Descendant[] = [
  {
    children: [
      { children: [{ text: 'one' }]},
    ],
  },
  { children: [{ text: 'two' }]},
  {
    children: [
      { children: [{ text: 'three' }]},
    ]
  }
];

const children: Descendant[] = [
  {
    children: [
      { children: [{ text: 'one' }]},
      { children: [{ text: 'two' }]},
      { children: [{ text: 'three' }]},
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
    Transforms.liftNodes(editor, { at: [0, 1] });
    expect(editor.children).toStrictEqual(output);
  })
})


