const sortObjectKeys = obj => JSON.parse(JSON.stringify(obj, Object.keys(obj).sort()))

const removeDuplicates = arr => {
  const dedupe = arr.map(sortObjectKeys)
  return [...new Set(dedupe)]
}

const expandExamples = examples => {
  return removeDuplicates([].concat(... examples.map(example => {
    return examples.map(otherExample => Object.assign({}, example, otherExample))
  })))
}

module.exports = {expandExamples}
