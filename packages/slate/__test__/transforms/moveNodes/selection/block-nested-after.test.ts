import { createEditor } from "../../../../src/create-editor";
import { Descendant } from "../../../../src/interfaces/node";
import { Transforms } from "../../../../src/transforms";
import { Element as SlateElement } from '../../../../src/interfaces/element';

const children: Descendant[] = [
  {
    children: [
      {
        children: [{ text: 'one' }],
      },
      {
        children: [{ text: 'two' }],
      },
      {
        children: [{ text: 'three' }],
      },
    ]
  }
];

const output: Descendant[] = [
  {
    children: [
      { children: [{ text: 'one' }]}
    ],
  },
  {
    children: [{ text: 'two' }],
  },
  {
    children: [{ text: 'three' }],
  },
]

describe('transfroms.moveNodes', () => {
  let editor;

  beforeAll(() => {
    editor = createEditor();
    editor.children = children;
    editor.selection = { anchor: { path: [0,1,0], offset: 0 }, focus: {path: [0,2,0], offset: 5 } };
  });

  it('block', () => {
    Transforms.moveNodes(editor, {
      match: n => SlateElement.isElement(n),
      to: [1],
    });
    expect(editor.children).toStrictEqual(output);
    // TODO：selection 存在问题
    // expect(editor.selection).toStrictEqual({ anchor: { path: [0,1], offset: 0 }, focus: {path: [0,2], offset: 5 } });
  })
})


