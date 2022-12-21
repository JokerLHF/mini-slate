import { Operation } from "./operation"
import { Path } from "./path";
import { TextDirection } from "./types";

export interface PathRef {
  current: Path | null;
  unref(): Path | null;
  affinity: TextDirection | null;
}

export interface PathRefInterface {
  transform: (ref: PathRef, op: Operation) => void
}

// eslint-disable-next-line no-redeclare
export const PathRef: PathRefInterface = {
  /**
   * Transform the point ref's current value by an operation.
   */

  transform(ref: PathRef, op: Operation): void {
    const { current, affinity } = ref

    if (current == null) {
      return
    }

    const point = Path.transform(current, op, { affinity })
    ref.current = point

    if (point == null) {
      ref.unref()
    }
  },
}
