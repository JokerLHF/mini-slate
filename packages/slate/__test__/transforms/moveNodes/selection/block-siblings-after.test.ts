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
    children: [{ text: 'three' }],
  },
  {
    children: [{ text: 'one' }],
  },
  {
    children: [{ text: 'two' }],
  },
]

describe('transfroms.moveNodes', () => {
  let editor;

  beforeAll(() => {
    editor = createEditor();
    editor.children = children;
    editor.selection = { anchor: { path: [0,0], offset: 3 }, focus: {path: [1,0], offset: 3 } };
  });

  it('block', () => {
    Transforms.moveNodes(editor, {
      match: n => SlateElement.isElement(n),
      to: [2],
    });
    expect(editor.children).toStrictEqual(output);
    expect(editor.selection).toStrictEqual({ anchor: { path: [1,0], offset: 3 }, focus: {path: [2,0], offset: 3 } });
  })
})


