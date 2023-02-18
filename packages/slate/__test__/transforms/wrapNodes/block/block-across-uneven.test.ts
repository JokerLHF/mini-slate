import { createEditor } from "../../../../src/create-editor";
import { Descendant } from "../../../../src/interfaces/node";
import { Transforms } from "../../../../src/transforms";

const children: Descendant[] = [
  {
    children: [
      { children: [{ text: 'word' }] },
      { children: [{
        children: [{ text: 'another' }],
      }] },
    ],
  },
];

const output: Descendant[] = [
  {
    children: [
      {
        children: [
          { children: [{ text: 'word' }] },
          { children: [{
            children: [{ text: 'another' }],
          }] },
        ],
        type: 'a',
      },
    ],
  },
]

describe('transfroms.wrapNodes', () => {
  let editor;

  beforeAll(() => {
    editor = createEditor();
    editor.children = children;
    editor.selection = { anchor: { path: [0,0,0], offset: 2 }, focus: { path: [0,1,0,0], offset: 2 } };
  });

  it('block-across-uneven', () => {
    Transforms.wrapNodes(editor, { type: 'a', children: [] });
    expect(editor.children).toStrictEqual(output);
    expect(editor.selection).toStrictEqual({ anchor: { path: [0,0,0,0], offset: 2 }, focus: { path: [0,0,1,0, 0], offset: 2 } });
  })
})

