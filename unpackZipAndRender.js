#!/Users/mcarey/.nvm/versions/node/v12.4.0/bin/node

const Promise = require('bluebird')
const nunjucks = require('nunjucks')
const fs = Promise.promisifyAll(require('fs'))
const path = require('path')
const YAML = require('yaml')

const rootPath = process.argv[2] || '/Users/mcarey/projects/opensource/hmrc/x-frontend-snapshotter/target/govuk-frontend-2.13.0'
const componentPath = path.join(rootPath, 'src', 'components')
const outputPath = path.join(__dirname, 'target', 'processed')

const isDirectory = (...pathParts) => fs.lstatAsync(path.join(...pathParts)).then(stats => stats.isDirectory())
const flatten = x => [].concat(...x)

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

fs.readdirAsync(componentPath)
  .filter(fileOrDirName => isDirectory(componentPath, fileOrDirName))
  .map(componentName => fs.readFileAsync(path.join(componentPath, componentName, `${componentName}.yaml`))
    .then(yamlToParse => YAML.parse(yamlToParse.toString()).examples.map(example => ({
      component: componentName,
      exampleRef: example.name,
      uniqueExampleRef: ensureUniqueName(`${componentName}-${example.name}`.replace(/([\s]+)/g, '-')),
      data: example.data
    })))
  )
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
  .tap(examples => examples.forEach(example => fs.writeFileAsync(path.join(outputPath, example.uniqueExampleRef, 'input.json'), JSON.stringify(example.data, null, 2))))
  .tap(examples => examples.forEach(example => fs.writeFileAsync(path.join(outputPath, example.uniqueExampleRef, 'component.json'), JSON.stringify({name: example.componentName}, null, 2))))
  .tap(examples => examples.forEach(example => fs.writeFileAsync(path.join(outputPath, example.uniqueExampleRef, 'output.html'), example.html)))
  .then(() => console.log('done'))