import { Text } from '@src/index'

const input = [
  {
    anchor: {
      path: [0],
      offset: 0,
    },
    focus: {
      path: [0],
      offset: 1,
    },
    decoration: 'decoration',
  },
]

const output = [
  {
    text: 'a',
    mark: 'mark',
    decoration: 'decoration',
  },
  {
    text: 'bc',
    mark: 'mark',
  },
]

describe('decorations start', () => {
  it('test decorations start', () => {
    expect(Text.decorations({ text: 'abc', mark: 'mark' }, input)).toStrictEqual(output)
  })
})
