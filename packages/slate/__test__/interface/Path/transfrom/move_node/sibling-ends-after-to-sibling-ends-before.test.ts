import { Operation } from "../../../../../src/interfaces/operation";
import { Path } from "../../../../../src/interfaces/path";

const path = [0, 1]
const op = {
  type: 'move_node',
  path: [0, 3],
  newPath: [0, 0],
} as Operation

const output = [0, 2]

describe('path.moveNode', () => {
  it('moveNode', () => {
    const res = Path.transform(path, op);
    expect(res).toEqual(output);
  })
})
