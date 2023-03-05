import { createEditor, Descendant, Editor, Transforms } from '@src/index'

const output: Descendant[] = [
  {
    children: [
      { 
        children: [{ text: 'one' }],
        type: 'c'
      }
    ],
    type: 'a',
  },
];

const children: Descendant[] = [
  {
    children: [
      { 
        children: [
          { 
            children: [{ text: 'one' }],
            type: 'c'
          }
        ],
        type: 'b',
      },
    ],
    type: 'a',
  },
]

describe('transfroms.liftNodes', () => {
  let editor: Editor;

  beforeAll(() => {
    editor = createEditor();
    editor.children = children;
    editor.selection = { anchor: { path: [0,0,0,0], offset: 0 }, focus: { path: [0,0,0,0], offset: 0 } };
  });

  it('block', () => {
    Transforms.liftNodes(editor);
    expect(editor.children).toStrictEqual(output);
    expect(editor.selection).toStrictEqual({ anchor: { path: [0,0,0], offset: 0 }, focus: { path: [0,0,0], offset: 0 } });
  })
})


