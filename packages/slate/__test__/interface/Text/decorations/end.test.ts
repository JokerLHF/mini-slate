import { Text } from '@src/index'

const input = [
  {
    anchor: {
      path: [0],
      offset: 2,
    },
    focus: {
      path: [0],
      offset: 3,
    },
    decoration: 'decoration',
  },
]

const output = [
  {
    text: 'ab',
    mark: 'mark',
  },
  {
    text: 'c',
    mark: 'mark',
    decoration: 'decoration',
  },
]

describe('decorations end', () => {
  it('test decorations end', () => {
    expect(Text.decorations({ text: 'abc', mark: 'mark' }, input)).toStrictEqual(output)
  })
})
