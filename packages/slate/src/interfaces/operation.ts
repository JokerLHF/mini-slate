import { Range } from '../interfaces/range';
import { Path } from './path';
import { Node } from './node';

export type BaseSetSelectionOperation = {
  type: 'set_selection';
  properties: null;
  newProperties: Range;
} | {
  type: 'set_selection';
  properties: Partial<Range>;
  newProperties: Partial<Range>;
} | {
  type: 'set_selection';
  properties: Range;
  newProperties: null;
};

export type BaseTextOperation = {
  type: 'insert_text';
  path: Path;
  offset: number;
  text: string;
} | {
  type: 'remove_text';
  path: Path;
  offset: number;
  text: string;
};

/**
 * op 的设计为了 undo，基本上相反操作的 op 参数都是一样的或者成对出现
 */
export type BaseNodeOperation = {
  type: 'split_node';
  path: Path;
  position: number;
} | {
  type: 'merge_node';
  path: Path;
  position: number;
} | {
  type: 'insert_node';
  node: Node;
  path: Path;
} | {
  type: 'remove_node';
  node: Node;
  path: Path;
} | {
  type: 'set_node';
  path: Path;
  newProperties: Partial<Node>;
  properties: Partial<Node>;
} 

export type Operation = BaseTextOperation | BaseSetSelectionOperation | BaseNodeOperation;

/**
 * slate 本身提供的
 */
export interface OperationInterface {
  inverse: (op: Operation) => Operation;
}

// eslint-disable-next-line no-redeclare
export const Operation: OperationInterface = {
  inverse(op: Operation): Operation {
    switch(op.type) {
      case 'set_selection': {
        const { properties, newProperties } = op

        if (properties == null) {
          return {
            ...op,
            properties: newProperties as Range,
            newProperties: null,
          }
        } else if (newProperties == null) {
          return {
            ...op,
            properties: null,
            newProperties: properties as Range,
          }
        } else {
          return { ...op, properties: newProperties, newProperties: properties }
        }
      }
      case 'set_node': {
        const { newProperties, properties } = op;
        return { ...op, newProperties: properties, properties: newProperties };
      }
      case 'insert_text': {
        return { ...op, type: 'remove_text' };
      }
      case 'remove_text': {
        return { ...op, type: 'insert_text' };
      }
      /**
       * 【123】【4567】中间插入【0】, 变为【123】【0】【4567】
       *  insert操作的 op 是 { path: [0, 1], node: xxx }，
       *  如果想要回退的话， 就需要删除掉【0】
       */
      case 'insert_node': {
        return { ...op, type: 'remove_node' }
      }
      case 'remove_node': {
        return { ...op, type: 'insert_node' }
      }      
      /**
       * 【123】【4567】 合并成 【1234567】,
       *  merge操作的 op 是 { path: [0, 1], position: 3 }，【4567】合并到【123】
       *  如果想要回退的话， 就需要【1234567】按照 position 拆
       */
      case 'merge_node': {
        return { ...op, type: 'split_node', path: Path.previous(op.path) }
      }
      /**
       * 【1234567】拆分成【123】【4567】
       *  split操作的 op 是 { path: [0, 0], position: 3 }
       *  想要回退的话，就需要【4567】合并前一个
       */
      case 'split_node': {
        return { ...op, type: 'merge_node', path: Path.next(op.path) }
      }
    }
  }
}