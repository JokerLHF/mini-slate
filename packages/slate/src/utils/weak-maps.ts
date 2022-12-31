import { Editor } from "../interfaces/editor";
import { Path } from "../interfaces/path";
import { PathRef } from "../interfaces/path-ref";
import { PointRef } from "../interfaces/point-ref";
import { RangeRef } from "../interfaces/range-ref";

export const FLUSHING: WeakMap<Editor, boolean> = new WeakMap();
export const POINT_REFS: WeakMap<Editor, Set<PointRef>> = new WeakMap();
export const RANGE_REFS: WeakMap<Editor, Set<RangeRef>> = new WeakMap();
export const PATH_REFS: WeakMap<Editor, Set<PathRef>> = new WeakMap();
export const DIRTY_PATHS: WeakMap<Editor, Path[]> = new WeakMap();
export const DIRTY_PATHS_KEYS: WeakMap<Editor, Set<string>> = new WeakMap();
export const NORMALIZING: WeakMap<Editor, boolean> = new WeakMap();
