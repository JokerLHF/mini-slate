import { Range } from '../interfaces/range';
import { isPlainObject } from 'is-plain-object';
import { ExtendedType } from './custom-types';

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


export type Operation = ExtendedType<BaseSetSelectionOperation>;

/**
 * slate 本身提供的
 */
export interface OperationInterface {
  isOperation: (value: any) => value is Operation
  isOperationList: (value: any) => value is Operation[]
}

// eslint-disable-next-line no-redeclare
export const Operation: OperationInterface = {
  isOperation(value: any): value is Operation {
    if (!isPlainObject(value)) {
      return false
    }

    switch (value.type) {
      case 'set_selection':
       return (
        (value.properties === null && Range.isRange(value.newProperties)) ||
        (isPlainObject(value.properties) && isPlainObject(value.newProperties))
       );
      default:
        return false;
    }
  },
  isOperationList(value: any): value is Operation[] {
    return (Array.isArray(value) && value.every(val => Operation.isOperation(val)))
  },
}