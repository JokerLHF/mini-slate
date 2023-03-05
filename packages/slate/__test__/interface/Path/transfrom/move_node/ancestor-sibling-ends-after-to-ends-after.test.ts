import { Operation, Path } from '@src/index'

const path = [3, 3, 3]
const op = {
  type: 'move_node',
  path: [4],
  newPath: [2],
} as Operation

const output = [4, 3, 3]


describe('path.moveNode', () => {
  it('moveNode', () => {
    const res = Path.transform(path, op);
    expect(res).toEqual(output);
  })
})


