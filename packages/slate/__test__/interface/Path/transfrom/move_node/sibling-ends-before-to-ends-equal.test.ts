import { Operation, Path } from '@src/index'

const path = [0, 1]
const op = {
  type: 'move_node',
  path: [0, 0],
  newPath: [0, 1],
} as Operation

const output = [0, 0]

describe('path.moveNode', () => {
  it('moveNode', () => {
    const res = Path.transform(path, op);
    expect(res).toEqual(output);
  })
})
