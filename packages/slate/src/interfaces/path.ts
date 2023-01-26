import produce from "immer";
import { PathRefOptions } from "./editor";
import { Operation } from "./operation";

export type Path = number[]

export interface PathInterface {
  isPath: (value: any) => value is Path;
  compare: (path: Path, another: Path) => -1 | 0 | 1;
  equals: (path: Path, another: Path) => boolean;
  common: (path: Path, another: Path) => Path;
  isCommon: (path: Path, another: Path) => boolean;
  next: (path: Path) => Path;
  previous: (path: Path) => Path;
  parent: (path: Path) => Path;
  isAfter: (path: Path, another: Path) => boolean;
  isAncestor: (path: Path, another: Path) => boolean;
  isBefore: (path: Path, another: Path) => boolean;
  ancestors: (path: Path) => Path[];
  levels: (path: Path) => Path[];
  transform(
    path: Path | null,
    op: Operation,
    options?: PathRefOptions,
  ): Path | null;
  endsBefore: (path: Path, another: Path) => boolean;
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

  // path 是 another 祖先或者相等
  isCommon(path: Path, another: Path): boolean {
    return path.length <= another.length && Path.compare(path, another) === 0
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
  ancestors(path: Path): Path[] {
    let paths = Path.levels(path)
    paths = paths.slice(0, -1)
    return paths
  },

  /**
   * 返回 path 所有的父节点包括自己，比如[1, 2, 3]
   * 返回 [1], [1, 2] [1, 2, 3]
   */
  levels(path: Path): Path[] {
    const list: Path[] = []
    for (let i = 0; i <= path.length; i++) {
      list.push(path.slice(0, i));
    }
    return list;
  },

  /**
   * path：[1,1] 
   * another：[1,2]
   * 判断 path 是不是 another 前面
   */
  endsBefore(path: Path, another: Path): boolean {
    const i = path.length - 1
    const as = path.slice(0, i)
    const bs = another.slice(0, i)
    const av = path[i]
    const bv = another[i]
    return Path.equals(as, bs) && av < bv
  },

  /**
   * 在这个 op 下，path 应该如何装换
   */
  transform(
    path: Path | null,
    op: Operation,
    options?: PathRefOptions,
  ): Path | null {
    const { affinity = 'forward' } = options || {};
    return produce(path, p => {
      if (!p) {
        return null;
      }
      switch (op.type) {
        case 'insert_node': {
          if (
            Path.equals(op.path, p) ||
            Path.endsBefore(op.path, p) ||
            Path.isAncestor(op.path, p)
          ) {
           /**
            * 指向下一个
            * [0,0]
            *   [0,0,0]
            * [0,1]
            *   [0,1,0]
            * [0,2]
            *   [0,2,0]
            * 
            * endBefores场景：
            *   如果此时 path 是[0,2,0], 在[0,1] 中插入一个 node，
            *   对于[0,2,0]来说，需要在  op.path.length - 1 处 +1, 变成 [0,3,0]
            * 
            *   如果此时 path 是[0,2], 在[0,1] 中插入一个 node，
            *   对于[0,2]来说，需要在  op.path.length - 1 处 +1, 变成 [0,3]
            * 
            * isAncestor场景：
            *    如果此时 path 是[0,2,0], 在[0,2] 中插入一个 node，
            *    对于[0,2,0]来说，需要在  op.path.length - 1 处 +1, 变成 [0,3,0]
            * 
            */
            p[op.path.length - 1] += 1;
          }
          break;
        }
        case 'remove_node': {
          /**
           * 如果 path 是本身或者在其父节点，
           */
          if (Path.equals(op.path, p) || Path.isAncestor(op.path, p)) {
            return null
          } else if (Path.endsBefore(op.path, p)) {
           /**
            * 如果删除的 op.path 在 p 左边，那么对于 p 需要 -1
            * [0,0]
            * [0,1]
            * [0,2]
            *   [0,2,1]
            * 删掉[0,1] 对于[0,2,1]来说就需要在 op.path.length - 1 处 -1
            */
            p[op.path.length - 1] -= 1;
          }
          break;
        }
        case 'split_node': {
          // 自身的修改
          if (Path.equals(op.path, p)) {
            if (affinity === 'forward') {
              p[p.length - 1] += 1
            } else if (affinity === 'backward') {
              // Nothing, because it still refers to the right path.
            } else {
              return null
            }
          } else if (Path.endsBefore(op.path, p)) {
            /**
            * [0,0]
            * [0,1]
            * [0,2]
            *   [0,2,1]
            * 
            * 对 [0,1] 节点进行了 spalitNode（1分为2）
            * 对于[0,2,1] 来说，就需要在 op.path.length - 1 处 +1
            */
            p[op.path.length - 1] += 1
          } 
          // 这个逻辑是对于 slateElement 的分割来说的，也就是 { path: [0,0], position: 1 }，
          // 其实是对 [0,0] 的第一个children分隔，对于 [0,0] 第二个 children，第三个 children 节点的 path 需要改变，
          // 所以才有 p[op.path.length] >= op.position
          else if (Path.isAncestor(op.path, p) && p[op.path.length] >= op.position) {
            /**
             * [0]
             *  [0,0](AElement)
             *     [0,0,0](BElement)
             *     [0,0,1](CElement)
             * 
             * 对 [0,0] 节点进行了 spalitNode（1分为2）{ path: [0,0], position: 1 }
             * 
             * [0]
             *  [0,0](AElement)
             *     [0,0,0](BElement)
             *  [0,1]
             *     [0,1,0](CElement)
             * 
             * 对于[0,0,1]来说，
             *  之前是按照分支的position进行分割。独立成为一个分支之后位置需要 -position 得到新的位置
             *  独立成为新的分支，新的分支的位置是在 [0,0] 的右边，就需要在 op.path.length - 1 处 +1
             */
             p[op.path.length - 1] += 1;
             p[op.path.length] -= op.position;
          }
          break;
        }
        case 'merge_node': {
          if (Path.equals(op.path, p) || Path.endsBefore(op.path, p)) {
            /**
            * [0,0]
            * [0,1]
            * [0,2]
            *   [0,2,1]
            * [0,1] 合并到[0,0], 对于[0,2,1]来说就需要在 op.path.length - 1 处 -1
            */
            p[op.path.length - 1] -= 1;
          }
          break;
        }
      }
    });
  }
}