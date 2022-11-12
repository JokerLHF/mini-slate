import { Path } from "./path"
import { isPlainObject } from 'is-plain-object';
import { ExtendedType } from "./custom-types";

export interface BasePoint {
  path: Path
  offset: number
}

export type Point = ExtendedType<BasePoint>;

export interface PointInterface {
  isPoint: (value: any) => value is Point,
  isAfter: (point: Point, another: Point) => boolean,
  compare: (point: Point, another: Point) => -1 | 0 | 1,
  equals: (point: Point, another: Point) => boolean,
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
  }
}