import { Text } from '../../../../src/interfaces/text'

const input = [
  {
    anchor: {
      path: [0],
      offset: 1,
    },
    focus: {
      path: [0],
      offset: 2,
    },
    decoration1: 'decoration1',
  },
  {
    anchor: {
      path: [0],
      offset: 2,
    },
    focus: {
      path: [0],
      offset: 2,
    },
    decoration2: 'decoration2',
  },
  {
    anchor: {
      path: [0],
      offset: 2,
    },
    focus: {
      path: [0],
      offset: 3,
    },
    decoration3: 'decoration3',
  },
  {
    anchor: {
      path: [0],
      offset: 4,
    },
    focus: {
      path: [0],
      offset: 4,
    },
    decoration4: 'decoration4',
  },
]

const output = [
  {
    text: 'a',
    mark: 'mark',
  },
  {
    text: 'b',
    mark: 'mark',
    decoration1: 'decoration1',
  },
  {
    text: '',
    mark: 'mark',
    decoration1: 'decoration1',
    decoration2: 'decoration2',
    decoration3: 'decoration3',
  },
  {
    text: 'c',
    mark: 'mark',
    decoration3: 'decoration3',
  },
  {
    text: 'd',
    mark: 'mark',
  },
  {
    text: '',
    mark: 'mark',
    decoration4: 'decoration4',
  },
]

describe('decorations collapse', () => {
  it('test decorations collapse', () => {
    expect(Text.decorations({ text: 'abcd', mark: 'mark' }, input)).toStrictEqual(output)
  })
})
