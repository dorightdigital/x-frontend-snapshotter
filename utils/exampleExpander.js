const startTimer = (name) => {
  const t = process.hrtime()
  return {
    stopAndLog: () => {
      const diff = process.hrtime(t)
      console.log('timer for [%s] took [%s] seconds', name, diff[0] * 1000000 + diff[1] / 1000)
    }
  }
}


const sortObjectKeys = obj => JSON.stringify(obj, Object.keys(obj).sort())

const removeDuplicates = arr => {
  const t = startTimer('removeDuplicates')
  const dedupe = arr.map(sortObjectKeys)
  const ans = [...new Set(dedupe)].map(JSON.parse)
  t.stopAndLog()
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
  let remainingRuns = 2

  while(expandExamples.length !== previousLength && remainingRuns-- > 0) {
    console.log('remaining runs [%s], example length [%s]', remainingRuns, expandedExamples.length)
    previousLength = expandedExamples.length
    const t = startTimer(`expand ${expandedExamples.length} items`)
    expandedExamples = expand(expandedExamples)
    t.stopAndLog()
  }

  return expandedExamples
}

module.exports = {expandExamples}