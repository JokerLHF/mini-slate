import { Path } from "./path"
import { isPlainObject } from 'is-plain-object';
import { ExtendedType } from "./custom-types";
import { Operation } from "./operation";
import produce from "immer";
import { PointRefOptions } from "./editor";

export interface BasePoint {
  path: Path
  offset: number
}

export type Point = ExtendedType<BasePoint>;
export type PointEntry = [Point, 'anchor' | 'focus'];

export interface PointInterface {
  isPoint: (value: any) => value is Point,
  isAfter: (point: Point, another: Point) => boolean,
  isBefore: (point: Point, another: Point) => boolean,
  compare: (point: Point, another: Point) => -1 | 0 | 1,
  equals: (point: Point, another: Point) => boolean,
  transform: (
    point: Point,
    op: Operation,
    options?: PointRefOptions,
  ) => Point | null
}

export const Point: PointInterface = {
  isPoint(value: any): value is Point {
    return (
      isPlainObject(value) &&
      typeof value.offset === 'number' &&
      Path.isPath(value.path)
    )
  },
  /**
   * Check if a point is after another.
   */
  isAfter(point: Point, another: Point): boolean {
    return Point.compare(point, another) === 1;
  },

  isBefore(point: Point, another: Point): boolean {
    return Point.compare(point, another) === -1;
  },

  /**
   * 比较两个 Point 的前后关系
   * -1 表示 point 在 another 前面
   * 1 表示 point 在 another 后面
   * 0 表示 point 和 another 想等是同一个 point
   */
  compare(point: Point, another: Point): -1 | 0 | 1 {
    const result = Path.compare(point.path, another.path);
    // 对于 point 来说，path 对应的是 slateText，所以 point 和 another 在 result=0 时不可能是祖先关系，只能是想等关系
    if (result === 0) {
      if (point.offset < another.offset) return -1
      if (point.offset > another.offset) return 1
      return 0
    }
    return result;
  },
  equals(point: Point, another: Point): boolean {
    return Path.equals(point.path, another.path) && point.offset == another.offset;
  },

  /**
   * 在这个 op 下，point 应该如何装换
   */
  transform(
    point: Point | null,
    op: Operation,
    options?: PointRefOptions,
  ): Point | null {
    const { affinity = 'forward' } = options || {};
    return produce(point, p => {
      if (!p) {
        return null;
      }
      const { path } = p;

      switch (op.type) {
        case 'insert_text': {
          // 指向 insertText 的位置
          const { path, text, offset } = op;
          if (Path.equals(path, p.path) && p.offset === offset) {
            p.offset += text.length
          }
          break;
        }
        case 'remove_text': {
          const { path } = op;
          /**
           * 12|3
           * 从23交界处删除一个字符，此时的 op.offset 是 1， path.offset 是2
           */
          if (Path.equals(path, p.path) && op.offset <= p.offset) {
            p.offset -= p.offset - op.offset;
          }
          break;
        }
        case 'split_node': {
          // 自身的 op 需要改变 offset
          if (Path.equals(op.path, path)) {
            /**
             * 12|3|4
             * 假设选区选择了3，首先会对 focus 的光标的点进行拆分
             * 随后会对 anchor 的光标的点进行拆分，此时的 focus 的光标的位置也需要改变
             */
            if (
              op.position < p.offset || 
              (op.position === p.offset && affinity === 'forward')
            ) {
              p.offset -= op.position;
              p.path = Path.transform(path, op, { affinity: 'forward' })!;
            }
          } else {
            p.path = Path.transform(path, op, options)!;
          }
          break;
        }
        case 'insert_node': {
          // 指向 insertNode 的尾巴
          p.path = Path.transform(path, op)!;
          break;
        }
        case 'remove_node': {
          /**
           * 如果 point 是本身或者在其父节点，
           */
          if (Path.equals(op.path, path) || Path.isAncestor(op.path, path)) {
            return null;
          }

          p.path = Path.transform(path, op, options)!;
          break;
        }
        case 'merge_node': {
          /**
           * A,B 两个节点，B mergeTo A，
           * 此时 B 的 offset 应该变为 A.length+B.length, 
           * B 的 path 应该变为 A 的 path
           */
          if (Path.equals(op.path, path)) {
            p.offset += op.position;
          }
          p.path = Path.transform(path, op)!;
          break;
        }
        case 'move_node': {
          p.path = Path.transform(path, op)!;
          break;
        }
      }
    })
  }
}