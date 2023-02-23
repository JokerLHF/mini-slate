import { Operation } from "../../../../../src/interfaces/operation";
import { Path } from "../../../../../src/interfaces/path";

const path = [3, 3, 3]
const op = {
  type: 'move_node',
  path: [3, 3],
  newPath: [5, 1],
} as Operation

const output = [5, 1, 3]

describe('path.moveNode', () => {
  it('moveNode', () => {
    const res = Path.transform(path, op);
    expect(res).toEqual(output);
  })
})
