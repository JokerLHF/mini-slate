import { Operation } from "./operation"
import { Range } from "./range";
import { RangeDirection } from "./types";

export interface RangeRef {
  current: Range | null;
  unref(): Range | null;
  affinity: RangeDirection | null;
}

export interface RangeRefInterface {
  transform: (ref: RangeRef, op: Operation) => void
}

// eslint-disable-next-line no-redeclare
export const RangeRef: RangeRefInterface = {
  /**
   * Transform the point ref's current value by an operation.
   */

  transform(ref: RangeRef, op: Operation): void {
    const { current, affinity } = ref

    if (current == null) {
      return
    }

    const range = Range.transform(current, op, { affinity })
    ref.current = range

    if (range == null) {
      ref.unref()
    }
  },
}
