const { expandExamples } = require('./utils/exampleExpander')

const examplesByType = {
  string: [
    // '',
    // 'ABC',
    'abc',
    'a&b&c',
    'a&amp;b&amp;c',
    '<b>ABC</b>',
    // '<strong>a&amp;b&amp;c</strong>',
    // 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras sit amet nisi blandit, aliquam mauris interdum, dictum arcu. Ut eu magna nec neque pretium feugiat eget vel mauris. Cras quis libero lectus. Donec fringilla luctus augue vitae auctor. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Donec sed metus non enim dictum placerat. Nam vestibulum pretium ipsum. Proin dignissim ut mauris a lacinia. Aliquam erat volutpat. Duis augue erat, pharetra sed bibendum ut, iaculis id libero.\n' +
    // '\n' +
    // 'Suspendisse potenti. Nullam nibh mauris, tempor eu erat sit amet, sollicitudin consequat sapien. Ut tempus rhoncus lectus, vitae ornare quam blandit at. Nulla elementum vitae sapien tempus dictum. Praesent ut mi pharetra, congue turpis at, placerat lacus. Fusce ornare mi eu nunc tristique, ac imperdiet nisl viverra. Nulla non libero mi. Proin sit amet ligula hendrerit, gravida urna vitae, suscipit tellus. Nam ac felis vel tortor sollicitudin tempus. Suspendisse feugiat interdum volutpat. Fusce erat tellus, pellentesque sed euismod et, venenatis vitae urna. Donec vel scelerisque felis. Sed sagittis eu lectus a dignissim. Nullam rhoncus, ligula ac pellentesque rhoncus, nisl odio sagittis nunc, vel faucibus diam erat a augue. Curabitur sit amet leo nec massa porttitor elementum. Phasellus cursus hendrerit nulla.\n' +
    // '\n' +
    // 'Nam elementum neque nisl, eu malesuada turpis cursus sit amet. Vestibulum quis commodo sapien, sed sagittis magna. Sed viverra est auctor, posuere lectus et, rhoncus eros. Ut tristique justo sit amet sem consequat vulputate. Sed orci quam, posuere sed faucibus id, eleifend ac nunc. Pellentesque lacus libero, luctus bibendum rhoncus vel, iaculis sit amet mi. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Vestibulum molestie bibendum interdum. Donec leo odio, bibendum id lacus et, interdum faucibus metus. Morbi commodo ex vel tempus efficitur.\n' +
    // '\n' +
    // 'Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Vestibulum tempor a urna vitae pulvinar. Donec in maximus urna. Mauris aliquam elit in lorem tempus, eu volutpat mauris pellentesque. In hac habitasse platea dictumst. Morbi eu vestibulum libero. Nunc aliquet sem sit amet lacus pellentesque ultrices. Vestibulum sollicitudin porttitor ornare. Etiam eget suscipit arcu, at suscipit arcu. In id erat nec lacus mattis porttitor.\n' +
    // '\n' +
    // 'Curabitur auctor, erat a feugiat lobortis, mauris urna maximus enim, non hendrerit nisi nisl sed lectus. Etiam eget nulla dictum, varius metus vitae, aliquam nisi. Nulla ultricies sit amet ante quis dapibus. Aliquam gravida neque eu luctus imperdiet. Pellentesque velit mi, vulputate at dapibus eleifend, pretium vel odio. Proin odio justo, suscipit id purus ac, lacinia tincidunt velit. Quisque sollicitudin lectus orci, vitae vestibulum leo viverra ac. Aenean at urna aliquet, rhoncus neque a, placerat massa. Nulla sodales malesuada erat, non finibus risus tempus et. Aliquam iaculis finibus neque at molestie. Donec elit quam, rhoncus nec tortor quis, luctus sollicitudin tortor.',
    // 'https://example.com',
    // 'http://example.com',
    // '//example.com',
    // '/logout.html',
    // '?action=logout',
    // 'abc="def"'
  ],
  integer: [
    56260,
    -1,
    // 12,
    // 504398732982304982,
    0
  ],
  boolean: [
    true,
    false
  ],
  object: [
    {}
  ],
  array: [
    []
  ],
  'nunjucks-block': []
}

const flatten = x => [].concat(...x)

const composeObj = (key,value) => {
    const out = {}
    out[key] = value
    return out
  }

const ensureUniqueName = (function () {
  const usedNames = []
  return name => {
    let duplicateCount = 1
    let newName
    
    if (usedNames.includes(name)) {
      do {
        duplicateCount++
        newName = name + duplicateCount
      } while (usedNames.includes(newName))
        usedNames.push(newName)
      return newName
    } else {
      usedNames.push(name)
      return name
    }
  }
}())

const getCombinationsFromParams = params => flatten(params.map(param => examplesByType[param.type].map(example => composeObj(param.name, example)).concat(composeObj(param.name, undefined))))

process.on('message', ({ componentName, yaml }) => {
  const parsedYaml = JSON.parse(yaml)
  const componentExamples = parsedYaml.examples.map(example => ({
    component: componentName,
    uniqueExampleRef: ensureUniqueName(`${componentName}-${example.name}`.replace(/([\s]+)/g, '-')),
    data: example.data
  })).concat(expandExamples(getCombinationsFromParams(parsedYaml.params)).map(data => {
    const uniqueExampleRef = ensureUniqueName(`${componentName}-generated`)
    return { component: componentName, uniqueExampleRef, data }
  }))
  process.send(componentExamples)
});
