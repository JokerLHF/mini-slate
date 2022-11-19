export type Path = number[]

export interface PathInterface {
  isPath: (value: any) => value is Path;
  compare: (path: Path, another: Path) => -1 | 0 | 1;
  equals: (path: Path, another: Path) => boolean;
  common: (path: Path, another: Path) => Path;
  next: (path: Path) => Path;
  previous: (path: Path) => Path;
  parent: (path: Path) => Path;
  isAfter: (path: Path, another: Path) => boolean;
  isAncestor: (path: Path, another: Path) => boolean;
  isBefore: (path: Path, another: Path) => boolean;
  levels: (path: Path) => Path[];
}

export const Path: PathInterface = {
  isPath(value: any): value is Path {
    return (
      Array.isArray(value) &&
      (value.length === 0 || typeof value[0] === 'number')
    )
  },
  /**
   * 比较两个 path 的前后关系
   * -1 表示 path 在 another 前面
   * 1 表示 path 在 another 后面
   * 0 表示 path 和 another 是祖先关系或者相等关系
   */
  compare(path: Path, another: Path): -1 | 0 | 1 {
    const min = Math.min(path.length, another.length);
    for ( let i = 0; i < min; i++) {
      if (path[i] < another[i]) return -1;
      if (path[i] > another[i]) return 1;
    }
    return 0;
  },

  equals(path: Path, another: Path): boolean {
    return (path.length === another.length && path.every((n, i) => n === another[i]))
  },

  /**
   * Check if a path is after another.
   */

  isAfter(path: Path, another: Path): boolean {
    return Path.compare(path, another) === 1
  },

  /**
   * 判断 path 是否是 another 的祖先
   */
  isAncestor(path: Path, another: Path): boolean {
    return path.length < another.length && Path.compare(path, another) === 0
  },

  /**
   * Check if a path is before another.
   */

  isBefore(path: Path, another: Path): boolean {
    return Path.compare(path, another) === -1
  },

  /**
   * Get the common ancestor path of two paths.
   */
  common(path: Path, another: Path): Path {
    const common: Path = []

    for (let i = 0; i < path.length && i < another.length; i++) {
      const av = path[i]
      const bv = another[i]

      if (av !== bv) {
        break
      }

      common.push(av)
    }

    return common
  },

  /**
   * Given a path, get the path to the next sibling node.
   * 比如 [1, 2, 3] 返回 [1, 2, 4]
   */
  next(path: Path): Path {
    if (path.length === 0) {
      throw new Error(
        `Cannot get the next path of a root path [${path}], because it has no next index.`
      )
    }

    const last = path[path.length - 1]
    return path.slice(0, -1).concat(last + 1)
  },

    /**
   * Given a path, get the path to the next sibling node.
   * 比如 [1, 2, 3] 返回 [1, 2, 2]
   */
  previous(path: Path): Path {
    if (path.length === 0) {
      throw new Error(
        `Cannot get the next path of a root path [${path}], because it has no next index.`
      )
    }

    const last = path[path.length - 1]
    return path.slice(0, -1).concat(last - 1)
  },
    
  /**
   * Given a path, return a new path referring to the parent node above it.
   */
  parent(path: Path): Path {
    if (path.length === 0) {
      throw new Error(`Cannot get the parent path of the root path [${path}].`)
    }

    return path.slice(0, -1)
  },
  /**
   * 返回 path 所有的父节点，比如[1, 2, 3]
   * 返回 [1], [1, 2]
   */
  levels(path: Path): Path[] {
    const list: Path[] = []
    for (let i = 0; i <= path.length; i++) {
      list.push(path.slice(0, i));
    }
    return list;
  }
}