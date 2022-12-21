import { Operation } from "./operation"
import { Point } from "./point"
import { TextDirection } from "./types";

export interface PointRef {
  current: Point | null;
  unref(): Point | null;
  affinity: TextDirection | null;
}

export interface PointRefInterface {
  transform: (ref: PointRef, op: Operation) => void
}

// eslint-disable-next-line no-redeclare
export const PointRef: PointRefInterface = {
  /**
   * Transform the point ref's current value by an operation.
   */

  transform(ref: PointRef, op: Operation): void {
    const { current, affinity } = ref

    if (current == null) {
      return
    }

    const point = Point.transform(current, op, { affinity })
    ref.current = point

    if (point == null) {
      ref.unref()
    }
  },
}
