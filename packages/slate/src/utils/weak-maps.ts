import { Editor } from "../interfaces/editor";
import { PathRef } from "../interfaces/path-ref";
import { PointRef } from "../interfaces/point-ref";
import { RangeRef } from "../interfaces/range-ref";

export const FLUSHING: WeakMap<Editor, boolean> = new WeakMap();
export const POINT_REFS: WeakMap<Editor, Set<PointRef>> = new WeakMap();
export const RANGE_REFS: WeakMap<Editor, Set<RangeRef>> = new WeakMap();
export const PATH_REFS: WeakMap<Editor, Set<PathRef>> = new WeakMap();
