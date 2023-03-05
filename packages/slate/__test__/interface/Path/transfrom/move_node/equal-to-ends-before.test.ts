import { Operation, Path } from '@src/index'

const path = [3, 3]

const op = {
  type: 'move_node',
  path: [3, 3],
  newPath: [3, 1, 0],
} as Operation

const output = [3, 1, 0]

describe('path.moveNode', () => {
  it('moveNode', () => {
    const res = Path.transform(path, op);
    expect(res).toEqual(output);
  })
})
