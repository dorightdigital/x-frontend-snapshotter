const uuid = require('uuid/v1')

class Logger {
  constructor(name) {
    this.name = name
    this.id = uuid()
    this.t = process.hrtime()
    console.log('timer [%s] started for [%s]', this.id, name)
  }

  stopAndLog() {
    const diff = process.hrtime(this.t)
    console.log('timer [%s] for [%s] took [%s] seconds [%sms]', this.id , this.name, diff[0], diff[1] / 1000000)
  }
}

const sortObjectKeys = obj => JSON.stringify(obj, Object.keys(obj).sort())

const removeDuplicates = arr => {
  const dedupe = arr.map(sortObjectKeys)
  const ans = [...new Set(dedupe)].map(JSON.parse)
  return ans
}

const expand = examples => removeDuplicates([].concat(...examples.map(example => {
  return examples.map(otherExample => {
    return { ...example, ...otherExample }
  })
})))

const expandExamples = examples => {
  let expandedExamples = examples
  let previousLength = -1
  // decrease this in order to prevent stack overflow
  let remainingRuns = 3

  while(expandExamples.length !== previousLength && remainingRuns-- > 0) {
    console.log('remaining runs [%s], example length [%s]', remainingRuns, expandedExamples.length)
    previousLength = expandedExamples.length
    const t = new Logger(`expand ${expandedExamples.length} items`)
    expandedExamples = expand(expandedExamples)
    t.stopAndLog()
  }

  return expandedExamples
}

module.exports = {expandExamples}