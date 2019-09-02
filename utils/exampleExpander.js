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
  let remainingRuns = 1

  while(expandExamples.length !== previousLength && remainingRuns-- > 0) {
    // console.log('remaining runs [%s], example length [%s]', remainingRuns, expandedExamples.length)
    previousLength = expandedExamples.length
    expandedExamples = expand(expandedExamples)
  }

  return expandedExamples
}

module.exports = {expandExamples}