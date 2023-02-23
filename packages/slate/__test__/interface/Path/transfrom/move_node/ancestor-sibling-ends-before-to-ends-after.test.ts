import { Operation } from "../../../../../src/interfaces/operation";
import { Path } from "../../../../../src/interfaces/path";

const path = [3, 3, 3]
const op = {
  type: 'move_node',
  path: [2],
  newPath: [4],
} as Operation

const output = [2, 3, 3]

describe('path.moveNode', () => {
  it('moveNode', () => {
    const res = Path.transform(path, op);
    expect(res).toEqual(output);
  })
})
