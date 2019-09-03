#!/usr/bin/env node
const Logger = require('./utils/logger')

const Promise = require('bluebird')
const nunjucks = require('nunjucks')
const fs = Promise.promisifyAll(require('fs'))
const path = require('path')
const YAML = require('yaml')
const { fork } = require('child_process')

const rootPath = process.argv[2]
if (!rootPath) {
  throw new Error('Root Path Required, you may find `./generateGovukTestFixtures.sh 2.13.0` a useful helper.')
}
const componentPath = path.join(rootPath, 'src', 'components')
const outputPath = path.join(__dirname, 'target', 'processed')

const isDirectory = (...pathParts) => fs.lstatAsync(path.join(...pathParts)).then(stats => stats.isDirectory())
const flatten = x => [].concat(...x)
const generateFile = (filename, filePreparor) => examples => examples.map(example => Promise.resolve(filePreparor(example)).then(contents => fs.writeFileAsync(path.join(outputPath, example.uniqueExampleRef, filename), contents)))

nunjucks.configure([componentPath])

const deleteFolderRecursive = function (path) {
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

const spawnPromise = (script, componentName, yaml) => new Promise((resolve, reject) => {
  const child = fork(script)
  const t = new Logger(`new process for ${componentName}`)
  child.on('message', (res) => {
    t.stopAndLog()

    // TODO: kill process after all promises have resolved
    resolve(res)
  })
  child.send({ componentName, yaml })
})

const childScriptPath = path.join(rootPath, '../../', './gatherExamples.js')

fs.readdirAsync(componentPath)
  .filter(fileOrDirName => isDirectory(componentPath, fileOrDirName))
  .map(componentName => fs.readFileAsync(path.join(componentPath, componentName, `${componentName}.yaml`))
    .then(yamlToParse => YAML.parse(yamlToParse.toString()))
    .then(async yaml => await spawnPromise(childScriptPath, componentName, JSON.stringify(yaml)))
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
  .tap(generateFile('output.html', example => example.html))
  .tap(generateFile('input.json', example => JSON.stringify(example.data, null, 2)))
  .tap(generateFile('component.json', example => JSON.stringify({name: example.componentName}, null, 2)))
