import { createEditor } from "../../../../src/create-editor";
import { Descendant } from "../../../../src/interfaces/node";
import { Transforms } from "../../../../src/transforms";

const output: Descendant[] = [
  {
    children: [
      // 真正的测试用例是下面这个
      {
        children: [{ text: 'two' }],
      },
      {
        children: [{ text: 'one' }],
      }
    ]
  }
];

const children: Descendant[] = [
  {
    children: [{ text: 'one' }],
  },
  {
    children: [{
      children: [{ text: 'two' }]
    }],
  }
]

describe('transfroms.moveNodes', () => {
  let editor;

  beforeAll(() => {
    editor = createEditor();
    editor.children = children;
    editor.selection = { anchor: { path: [0,0], offset: 0 }, focus: {path: [0,0], offset: 0 } };
  });

  it('block', () => {
    Transforms.moveNodes(editor, { at: [0], to: [1, 1] })
    expect(editor.children).toStrictEqual(output);
    editor.selection = { anchor: { path: [1,0], offset: 0 }, focus: {path: [1,0], offset: 0 } };
  })
})


