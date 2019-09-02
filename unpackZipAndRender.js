#!/usr/bin/env node

const Promise = require('bluebird')
const nunjucks = require('nunjucks')
const fs = Promise.promisifyAll(require('fs'))
const path = require('path')
const YAML = require('yaml')
const { expandExamples } = require('./utils/exampleExpander')

const rootPath = process.argv[2]
if (!rootPath) {
  throw new Error('Root Path Required, you may find `./generateGovukTestFixtures.sh 2.13.0` a useful helper.')
}
const componentPath = path.join(rootPath, 'src', 'components')
const outputPath = path.join(__dirname, 'target', 'processed')

const isDirectory = (...pathParts) => fs.lstatAsync(path.join(...pathParts)).then(stats => stats.isDirectory())
const flatten = x => [].concat(...x)
const generateFile = (filename, filePreparor) => examples => examples.map(example => Promise.resolve(filePreparor(example)).then(contents => fs.writeFileAsync(path.join(outputPath, example.uniqueExampleRef, filename), contents)))

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

nunjucks.configure([componentPath])

const deleteFolderRecursive = function(path) {
  if (fs.existsSync(path)) {
    fs.readdirSync(path).forEach(function(file, index){
      var curPath = path + "/" + file;
      if (fs.lstatSync(curPath).isDirectory()) { // recurse
        deleteFolderRecursive(curPath);
      } else { // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
};

const types = []

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

const composeObj = (key,value) => {
  const out = {}
  out[key] = value
  return out
}

const getCombinationsFromParams = params => flatten(params.map(param => examplesByType[param.type].map(example => composeObj(param.name, example)).concat(composeObj(param.name, undefined))))

const gatherExamples = (componentName, parsedYaml) => parsedYaml.examples.map(example => ({
  component: componentName,
  uniqueExampleRef: ensureUniqueName(`${componentName}-${example.name}`.replace(/([\s]+)/g, '-')),
  data: example.data
})).concat(expandExamples(getCombinationsFromParams(parsedYaml.params)).map(data => {
  const uniqueExampleRef = ensureUniqueName(`${componentName}-generated`)
  console.log('uniqueExampleRef', uniqueExampleRef)
  return ({
    component: componentName,
    uniqueExampleRef,
    data
  })
}))

fs.readdirAsync(componentPath)
  .filter(fileOrDirName => isDirectory(componentPath, fileOrDirName))
  .map(componentName => fs.readFileAsync(path.join(componentPath, componentName, `${componentName}.yaml`))
    .then(yamlToParse => YAML.parse(yamlToParse.toString()))
    .then(yaml => gatherExamples(componentName, yaml))
  )
  .tap(x => {
    console.log(JSON.stringify(x, null, 2))
    process.exit(1)
  })
  .then(flatten)
  .map(example => ({ ...example,
    componentName: ['govuk', example.component.split('-').map(section => section[0].toUpperCase() + section.substr(1)).join('')].join('')
  }))
  .map(example => ({ ...example,
    nunjucks: `{% from '${example.component}/macro.njk' import ${example.componentName} %}{{${example.componentName}(${JSON.stringify(example.data, null, 2)})}}`
  }))
  .map(example => ({ ...example,
    html: nunjucks.renderString(example.nunjucks)
  }))
  .tap(() => deleteFolderRecursive(outputPath))
  .tap(() => fs.mkdirAsync(outputPath))
  .tap(examples => examples.forEach(example => fs.mkdirAsync(path.join(outputPath, example.uniqueExampleRef))))
  .tap(generateFile('output.html', example => example.html))
  .tap(generateFile('input.json', example => JSON.stringify(example.data, null, 2)))
  .tap(generateFile('component.json', example => JSON.stringify({name: example.componentName}, null, 2)))
