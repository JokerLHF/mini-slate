import { Range } from '../interfaces/range';
// import { isPlainObject } from 'is-plain-object';
import { Path } from './path';

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

export type BaseInsertTextOperation = {
  type: 'insert_text',
  path: Path,
  offset: number,
  text: string,
}

export type Operation = BaseInsertTextOperation | BaseSetSelectionOperation;

/**
 * slate 本身提供的
 */
export interface OperationInterface {
}

// eslint-disable-next-line no-redeclare
export const Operation: OperationInterface = {

}