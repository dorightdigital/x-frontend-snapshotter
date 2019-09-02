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

module.exports = Logger