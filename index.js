const Bcc = require('./src/bcc')

function bccFactory (options) {
  return new Bcc(options)
}

bccFactory.Bcc = Bcc

module.exports = (options) => new Bcc(options)
