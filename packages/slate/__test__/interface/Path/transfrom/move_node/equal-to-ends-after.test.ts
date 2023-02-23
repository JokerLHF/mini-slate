import { Operation } from "../../../../../src/interfaces/operation";
import { Path } from "../../../../../src/interfaces/path";

const path = [3, 3]
const op = {
  type: 'move_node',
  path: [3, 3],
  newPath: [3, 5, 0],
} as Operation

const output = [3, 4, 0]

describe('path.moveNode', () => {
  it('moveNode', () => {
    const res = Path.transform(path, op);
    expect(res).toEqual(output);
  })
})
