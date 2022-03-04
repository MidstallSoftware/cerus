import { BaseMessage } from '../../api/message'

describe('BaseMessage', () => {
  const data = {
    a: true,
    b: [{}],
    c: 0,
    d: {},
  }

  test('is error', () => {
    const error = new Error('An error')
    const m = new BaseMessage(data, error)
    const json = m.toJSON()

    expect(json).toMatchObject({
      error: {
        name: error.name,
        message: error.message,
      },
      type: 'error',
    })
  })

  test('is type', () => {
    const type = 'hello'
    const m = new BaseMessage(data, type)
    const json = m.toJSON()

    expect(json).toMatchObject({
      data,
      type,
    })
  })

  test('from json', () => {
    const type = 'hello'
    const m = BaseMessage.fromJSON({
      data,
      type,
    })
    const json = m.toJSON()

    expect(json).toMatchObject({
      data,
      type,
    })
  })
})
