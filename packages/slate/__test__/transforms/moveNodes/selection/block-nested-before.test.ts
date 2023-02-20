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
    ]
  }
];

const output: Descendant[] = [
  {
    children: [{ text: 'one' }],
  },
  {
    children: [{ text: 'two' }],
  },
  {
    children: [{ text: '' }],
  },
]

describe('transfroms.moveNodes', () => {
  let editor;

  beforeAll(() => {
    editor = createEditor();
    editor.children = children;
    editor.selection = { anchor: { path: [0,0,0], offset: 0 }, focus: {path: [0,1,0], offset: 3 } };
  });

  it('block', () => {
    Transforms.moveNodes(editor, {
      match: n => SlateElement.isElement(n),
      to: [0],
    });
    // TODO: 这里结果有问题
    expect(editor.children).toStrictEqual(output);
  })
})


