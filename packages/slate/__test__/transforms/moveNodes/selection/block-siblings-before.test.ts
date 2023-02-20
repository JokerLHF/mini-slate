import { createEditor } from "../../../../src/create-editor";
import { Descendant } from "../../../../src/interfaces/node";
import { Transforms } from "../../../../src/transforms";
import { Element as SlateElement } from '../../../../src/interfaces/element';

const children: Descendant[] = [
  {
    children: [{ text: 'one' }],
  },
  {
    children: [{ text: 'two' }],
  },
  {
    children: [{ text: 'three' }],
  }
];

const output: Descendant[] = [
  {
    children: [{ text: 'two' }],
  },
  {
    children: [{ text: 'three' }],
  },
  {
    children: [{ text: 'one' }],
  },
]

describe('transfroms.moveNodes', () => {
  let editor;

  beforeAll(() => {
    editor = createEditor();
    editor.children = children;
    editor.selection = { anchor: { path: [1,0], offset: 3 }, focus: {path: [2,0], offset: 5 } };
  });

  it('block', () => {
    Transforms.moveNodes(editor, {
      match: n => SlateElement.isElement(n),
      to: [0],
    });
    expect(editor.children).toStrictEqual(output);
    // TODO: 这里选区还有点问题，出来的结果是 { anchor: { path: [0,0], offset: 3 }, focus: {path: [2,0], offset: 5 } }
    // expect(editor.selection).toStrictEqual({ anchor: { path: [0,0], offset: 3 }, focus: {path: [1,0], offset: 5 } });
  })
})


