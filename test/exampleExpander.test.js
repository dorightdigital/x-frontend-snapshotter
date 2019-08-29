const { expandExamples } = require('../utils/exampleExpander')

expect.extend({
  toHaveAllItems(receivedIn, expectedIn) {
    const expected = expectedIn.map(JSON.stringify).sort()
    const received = receivedIn.map(JSON.stringify).sort()

    const missingItems = []
    const additionalItems = []

    expected.forEach(e => {
      if (!received.includes(e)) {
        missingItems.push(e)
      }
    })
    received.forEach(m => {
      if (!expected.includes(m)) {
        additionalItems.push(m)
      }
    })

    const summary = ['expected arrays to match but also found']

    const pass = missingItems.length === 0 && additionalItems.length === 0

    if (missingItems.length > 0) {
      summary.push(' missing items: ')
      summary.push('[')
      summary.push(missingItems.join(', '))
      summary.push(']')
    }
    if (additionalItems.length > 0) {
      summary.push(' additional items: ')
      summary.push('[')
      summary.push(additionalItems.join(', '))
      summary.push(']')
    }

    summary.push(`, added [${additionalItems.length}], missing [${missingItems.length}]`)
    summary.push(`whole object provided [${received.join(', ')}]`)

    if (pass) {
      return {
        message: () =>
          `arrays contained the same items but different items were expected`,
        pass: true,
      };
    } else {
      return {
        message: () => summary.join(''),
        pass: false,
      };
    }
  },
});

test('should feed back the only provided example', () => {
  expect(expandExamples([
    {a: 1}
  ])).toHaveAllItems([
    {a: 1}
  ])
})

test('should merge two examples', () => {
  expect(expandExamples([
    {a: 1},
    {b: 2}
  ])).toHaveAllItems([
    {a: 1},
    {b: 2},
    {a: 1, b: 2}
  ])
})

test('should merge three examples with the second and third sharing keys', () => {
  expect(expandExamples([
    {a: 1},
    {b: 2},
    {b: 3}
  ])).toHaveAllItems([
    {a: 1},
    {b: 2},
    {b: 3},
    {a: 1, b: 2},
    {a: 1, b: 3}
  ])
})

test('should merge three examples with the first and second sharing keys', () => {
  expect(expandExamples([
    {a: 1},
    {a: 2},
    {b: 3}
  ])).toHaveAllItems([
    {a: 1},
    {a: 2},
    {b: 3},
    {a: 1, b: 3},
    {a: 2, b: 3}
  ])
})
