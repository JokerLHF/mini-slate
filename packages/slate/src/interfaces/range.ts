import { Point, PointEntry } from "./point"
import { isPlainObject } from 'is-plain-object';
import { ExtendedType } from "./custom-types";
import { Operation } from "./operation";
import { RangeRefOptions } from "./editor";
import produce from "immer";
import { Path } from "./path";

export interface BaseRange {
  anchor: Point
  focus: Point
}

export type Range = ExtendedType<BaseRange>;

export interface RangeInterface {
  isRange: (value: any) => value is Range;
  isBackward: (range: Range) => boolean;
  edges: (range: Range) => [Point, Point];
  start: (range: Range) => Point;
  end: (range: Range) => Point;
  isCollapsed: (range: Range) => boolean;
  transform: (
    range: Range,
    op: Operation,
    options?: RangeRefOptions,
  ) => Range | null;
  points: (range: Range) => Generator<PointEntry, void, undefined>;
  includes: (range: Range, target: Path) => boolean;
  intersection: (range: Range, anchor: Range) => Range | null;
  equals: (range: Range, another: Range) => boolean;
}

export const Range: RangeInterface = {
  *points(range: Range): Generator<PointEntry, void, undefined> {
    yield [range.anchor, 'anchor']
    yield [range.focus, 'focus']
  },

  equals(range: Range, another: Range): boolean {
    return (
      Point.equals(range.anchor, another.anchor) &&
      Point.equals(range.focus, another.focus)
    )
  },

  isRange(value: any): value is Range {
    return (
      isPlainObject(value) &&
      Point.isPoint(value.anchor) &&
      Point.isPoint(value.focus)
    );
  },

  /**
   * 获取一个范围与另一个范围的交集。
   */
  intersection(range: Range, another: Range): Range | null {
    const [s1, e1] = Range.edges(range);
    const [s2, e2] = Range.edges(another);
    const start = Point.isBefore(s1, s2) ? s2 : s1;
    const end = Point.isBefore(e1, e2) ? e1 : e2;

    if (Point.isBefore(end, start)) {
      return null;
    }

    return { anchor: start, focus: end };
  },
  
  /**
   * 按照它们在文档中的显示顺序，返回起点终点。
   *   - range 是从后到前 { anchor: 后, focus: 前 }，会返回【前，后】
   *   - range 是从前到后 { anchor: 前, focus: 后 }，会返回【前，后】
   */
  edges(range: Range): [Point, Point] {
    const { anchor, focus } = range
    return Range.isBackward(range) ? [focus, anchor] : [anchor, focus];
  },

  /**
   * 检测 range 是从前到后 还是从后到前
   * Check if a range is backward, meaning that its anchor point appears in the
   * document _after_ its focus point.
   */
  isBackward(range: Range): boolean {
    const { anchor, focus } = range
    return Point.isAfter(anchor, focus)
  },

  /**
   * 按照 range 在文档中的显示顺序, 返回前面的 point
   */
  start(range: Range): Point {
    const [start, _] = Range.edges(range);
    return start;
  },
  /**
   * 按照 range 在文档中的显示顺序, 返回后面的 point
   */
  end(range: Range): Point {
    const [, end] = Range.edges(range);
    return end;
  },

  isCollapsed(range): boolean {
    return Point.equals(range.anchor, range.focus);
  },

  transform: (
    range: Range | null,
    op: Operation,
    options?: RangeRefOptions,
  ): Range | null => {
    return produce(range, (r: Range | null) => {
      if (!r) {
        return null;
      }
      const { affinity = 'inward' } = options || {};
      let affinityAnchor: 'forward' | 'backward' | null = null;
      let affinityFocus: 'forward' | 'backward' | null = null;
      const isCollapsed = Range.isCollapsed(r);
      if (affinity === 'inward') {
        // range 从后到前
        if (Range.isBackward(r)) {
          // 开始节点保持不变
          affinityAnchor = 'backward';
          // 结束节点指向下一个
          affinityFocus = isCollapsed ? 'backward' : 'forward';
        } else {
          // 开始节点指向下一个节点
          affinityAnchor = 'forward';
          // 结束节点保持不变
          affinityFocus = isCollapsed ? 'forward' : 'backward';
        }
      } else if (affinity === 'outward') {
        if (!Range.isBackward(r)) {
          affinityAnchor = 'backward' // 开始节点不变
          affinityFocus = 'forward' // 结束节点指向下一个
        } else {
          affinityAnchor = 'forward' // 开始节点指向下一个节点
          affinityFocus = 'backward' // 结束节点保持不变
        }
    } else {
        affinityAnchor = affinity
        affinityFocus = affinity
    }
      const anchor = Point.transform(r.anchor, op, { affinity: affinityAnchor })
      const focus = Point.transform(r.focus, op, { affinity: affinityFocus })

      if (!anchor || !focus) {
        return null
      }

      r.anchor = anchor
      r.focus = focus
    })
  },

  includes(range: Range, target: Path): boolean {
    const [start, end] = Range.edges(range);
    const targetIsAfterStart = Path.compare(target, start.path) >= 0;
    const targetIsBeforeEnd = Path.compare(target, end.path) <= 0;

    return targetIsAfterStart && targetIsBeforeEnd
  },

}