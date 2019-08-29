const stringify = obj => JSON.stringify(obj, Object.keys(obj).sort());

const removeDuplicates = arr => {
  arr.map(stringify).sort()
  let prev
  arr.filter(current => {
    const ans = current !== prev
    prev = current
    return ans
  })
  return arr
}

const expandExamples = examples => {
  return removeDuplicates([].concat(... examples.map(example => {
    return examples.map(otherExample => Object.assign({}, example, otherExample))
  })))
}

module.exports = {expandExamples}
