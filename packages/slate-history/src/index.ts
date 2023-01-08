import { Editor, Operation, Path } from 'slate';
import { HistoryEditor } from './history-editor';


export const withHistory = <T extends Editor>(editor: T): HistoryEditor => {
  const e = editor as T & HistoryEditor;

  const { apply } = e;
  e.history = { undos: [], redos: [] };
  
  e.redo = () => {
    const { history } = e;
    const batch = history.redos[history.redos.length - 1];
    if (!batch) {
      return;
    }

    HistoryEditor.withoutSaving(e, () => {
      Editor.withoutNormalizing(e, () => {
        for (const op of batch) {
          e.apply(op)
        }
        // redo 结束之后，将 redobatch 放入 undo，随后取消 redo
        history.undos.push(batch);
        history.redos.pop();
      });
    });
  };

  e.undo = () => {
    const { history } = e;
    const batch = history.undos[history.undos.length - 1];
    if (!batch) {
      return;
    }

    HistoryEditor.withoutSaving(e, () => {
      Editor.withoutNormalizing(e, () => {
        const inverseOps = batch.map(Operation.inverse).reverse();
        for (const op of inverseOps) {
          e.apply(op)
        }
        // undo 结束之后，将 undoBatch 放入 redo，随后取消 undo
        history.redos.push(batch)
        history.undos.pop()
      });
    });
  };

  e.apply = (op: Operation) => {
    const { history: { undos }, operations } = e;
    const lastBatch = undos[undos.length - 1];
    const lastOp = lastBatch && lastBatch[lastBatch.length - 1];

    // 1. 判断是否需要保留在历史记录中
    let save = HistoryEditor.isSaving(e);
    if (save === undefined) {
      save = shouldSave(op);
    }

    let merge = HistoryEditor.isMering(e);
    let overwrite = shouldOverwrite(op, lastOp);
    if (save) {
      if (merge === undefined) {
        // 2. 判断是否需要合并到同一个历史记录中
        if (!lastBatch) {
          merge = false;
        } else if (operations.length !== 0) {
          // e.operations 存在值就证明当前 op 跟其他 op 是在一个事件循环的, 需要合并
          merge = true;
        } else {
          merge = shouldMerge(op, lastOp);
        }
      }

      // 3. 需要合并则合并到同一个历史记录中，不需要则重写开一个历史记录栈
      if (lastBatch && merge) {
        if (overwrite) {
          lastBatch.pop();
        }
        lastBatch.push(op);
      } else {
        const newBatch = [op];
        undos.push(newBatch);
      }

      // 4. undo栈只能保留100个
      while (undos.length > 100) {
        undos.shift();
      }

      /**
       * 每次有新的 save 到undo中就需要清空 redo。为什么呢？
       *  比如现在文本是 123， undos:[[delete1, delete2, delete3]], redos: []
       *  触发一次 undo，那么此时文本是12，undos:[[delete1, delete2]], redos: [[insert3]]
       *  此时重新插入一个4，那么此时文本是124, 如果不清空的话：undos:[[delete1, delete2, delete4]], redos: [[insert3]]
       *      delete4 记录的位置是在point=2，删除一个文本，
       *      insert3 记录的位置是在point=2，插入一个文本，
       *   两者有冲突
       */
      e.history.redos = [];
    }

    apply(op);
  };

  return e;
}

/**
 * 判断是否需要放到历史记录中
 */
const shouldSave = (op: Operation) => {
  /**
   * 对于 select/deselect 这种一开始设置选区或者最后取消选区不需要记录到历史记录中。
   * 选区只有 setSelection 从一个 selection 设置为另一个 selection 才需要记录
   */
  if (
    op.type === 'set_selection' &&
    (op.newProperties === null || op.properties === null)
  ) {
    return false;
  }

  return true;
}

/**
 * slate 自身的一些优化手段来判断当前 op 是否应该和上一次 op 放在同一个 undo redo 栈中。
 * 注意这里即使两次 op 不在同一个事件循环中也有可能会被合并，比如连续插入 text
 */
const shouldMerge = (op: Operation, lastOp: Operation | undefined) => {
  // 连续一段连续的文本，随后删除。这个时候对于选区的选择应该合并在同一个历史记录中
  if (op.type === 'set_selection') {
    return true;
  }
  /**
   * 处理连续插入 text 的场景，上一次插入 text 之后继续插入 text
   * 这里有一个体验问题：在 undo 的时候会出问题。比如我连续插入3个1，undo 的时候预期是回退3次，目前只会回退一次。但是竞品其实也大多这个干
   */
  if (
    lastOp &&
    lastOp.type === 'insert_text' &&
    op.type === 'insert_text' && 
    Path.equals(op.path, lastOp.path)
  ) {
    return true;
  }

  /**
   * 处理连续删除 text 的场景，上一次删除 text 之后继续删除 text
   * 同上的体验问题
   */
  if (
    lastOp &&
    lastOp.type === 'remove_text' &&
    op.type === 'remove_text' && 
    Path.equals(op.path, lastOp.path)
  ) {
    return true;
  }

  return false;
}

/**
 * 对于一些相同的 op 只需要保留一个即可，比如连续移动光标，undo/redo 不需要全部记录，只需要记录最后一个
 */
const shouldOverwrite = (op: Operation, lastOp: Operation | undefined) => {
  if (
    lastOp &&
    lastOp.type === 'set_selection' &&
    op.type === 'set_selection'
  ) {
    return true;
  }
  return false;
}