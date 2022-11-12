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
    decoration: 'decoration',
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
    decoration: 'decoration',
  },
  {
    text: 'c',
    mark: 'mark',
  },
]

describe('decorations middle', () => {
  it('test decorations middle', () => {
    expect(Text.decorations({ text: 'abc', mark: 'mark' }, input)).toStrictEqual(output)
  })
})
