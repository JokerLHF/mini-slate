import { Point } from "./point"
import { isPlainObject } from 'is-plain-object';
import { ExtendedType } from "./custom-types";

export interface BaseRange {
  anchor: Point
  focus: Point
}

export type Range = ExtendedType<BaseRange>;

export interface RangeInterface {
  isRange: (value: any) => value is Range,
  isBackward: (range: Range) => boolean,
  edges: (range: Range) => [Point, Point],
  start: (range: Range) => Point,
  end: (range: Range) => Point,
  isCollapsed: (range: Range) => boolean,
}
export const Range: RangeInterface = {
  isRange(value: any): value is Range {
    return (
      isPlainObject(value) &&
      Point.isPoint(value.anchor) &&
      Point.isPoint(value.focus)
    );
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
}