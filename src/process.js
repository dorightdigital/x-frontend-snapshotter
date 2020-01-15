#!/usr/bin/env node

const Promise = require('bluebird')
const nunjucks = require('nunjucks')
const fs = Promise.promisifyAll(require('fs'))
const path = require('path')
const YAML = require('js-yaml')

const DEFAULT_YAML = 'examples:'

const rootPath = process.argv[2]
const org = ((parts) => parts[parts.length-3])(rootPath.split('/'))
const orgMap = { alphagov: 'govuk' }

const componentPathOverride = process.argv[3]
if (!rootPath) {
  throw new Error('Root Path Required, you may find `./generateTestFixtures.sh alphagov/govuk-frontend 2.13.0` a useful helper.')
}

function getComponentPath() {
  const paths = [
    path.join(rootPath, 'src', 'components'),
    path.join(rootPath, 'src', 'govuk', 'components'),
    path.join(rootPath, 'src', 'hmrc', 'components')
  ]
  let componentPath
  paths.forEach(path => componentPath = fs.existsSync(path) ? path : componentPath)
  return componentPath || '/'
}

const componentPath = componentPathOverride || getComponentPath()
const outputPath = path.join(__dirname, '../', 'target', 'processed')

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

function getExamplesFromYamlString(yamlToParse) {
  try {
    return YAML.safeLoad(yamlToParse, { json: true }).examples || [];
  } catch (err) {
    console.warn('Couldn\'t parse YAML for component')
    return []
  }
}

const renderNunjucksToHtml = nunjucksStr => {
  try {
    return nunjucks.renderString(nunjucksStr)
  } catch (err) {
    console.warn('failed to render nunjucks string:', JSON.stringify(nunjucksStr))
    return 'FAILED TO RENDER'
  }
}

fs.readdirAsync(componentPath)
  .filter(fileOrDirName => isDirectory(componentPath, fileOrDirName))
  .map(componentName => fs.readFileAsync(path.join(componentPath, componentName, `${componentName}.yaml`), 'utf8').catch(() => DEFAULT_YAML)
    .then(yamlToParse => getExamplesFromYamlString(yamlToParse).map(example => ({
      component: componentName,
      exampleRef: example.name,
      uniqueExampleRef: ensureUniqueName(`${componentName}-${example.name}`.replace(/([\s]+)/g, '-')),
      data: example.data
    })))
  )
  .then(flatten)
  .map(example => ({ ...example,
    componentName: [(orgMap[org] || org), example.component.split('-').map(section => section[0].toUpperCase() + section.substr(1)).join('')].join('')
  }))
  .reduce((result, example) => {
    const macroPath = `${example.component}/macro.njk`
    if (fs.existsSync(path.join(componentPath, macroPath))) {
      result.push({ ...example,
        nunjucks: `{% from '${macroPath}' import ${example.componentName} %}{{${example.componentName}(${JSON.stringify(example.data, null, 2)})}}`
      })
    }
    return result
  }, [])
  .map(example => ({ ...example,
    html: renderNunjucksToHtml(example.nunjucks)
  }))
  .tap(() => deleteFolderRecursive(outputPath))
  .tap(() => fs.mkdirAsync(outputPath))
  .tap(examples => examples.forEach(example => fs.mkdirAsync(path.join(outputPath, example.uniqueExampleRef))))
  .tap(generateFile('output.html', example => example.html))
  .tap(generateFile('input.json', example => JSON.stringify(example.data, null, 2)))
  .tap(generateFile('component.json', example => JSON.stringify({name: example.componentName}, null, 2)))
  .then(() => console.log('done'))
  .catch(err => {console.error(err); console.error(err.stack); process.exit(1)})
