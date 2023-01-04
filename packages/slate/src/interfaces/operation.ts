import { Range } from '../interfaces/range';
import { Path } from './path';
import { Node } from './node';

export type BaseSetSelectionOperation =
  | {
      type: 'set_selection'
      properties: null
      newProperties: Range
    }
  | {
    type: 'set_selection'
    properties: Partial<Range>
    newProperties: Partial<Range>
  }
  | {
    type: 'set_selection'
    properties: Range
    newProperties: null,
  }

export type BaseTextOperation = {
  type: 'insert_text',
  path: Path,
  offset: number,
  text: string,
} | {
  type: 'remove_text',
  path: Path,
  offset: number,
  text: string,
}

export type BaseNodeOperation = {
  type: 'split_node',
  path: Path,
  position: number,
} | {
  type: 'insert_node',
  node: Node,
  path: Path,
} | {
  type: 'set_node',
  path: Path,
  newProperties: Partial<Node>,
}| {
  type: 'merge_node',
  path: Path,
  position: number,
}| {
  type: 'remove_node',
  path: Path,
}

export type Operation = BaseTextOperation | BaseSetSelectionOperation | BaseNodeOperation;

/**
 * slate 本身提供的
 */
export interface OperationInterface {
}

// eslint-disable-next-line no-redeclare
export const Operation: OperationInterface = {

}