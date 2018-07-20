const test = require('tape')
const host = require('../config/local')
const Bcc = require('../src/bcc')
const bcc = new Bcc(host)

test('Basic RPCs', async t => {
  t.plan(3)
  const height = await bcc.getHeight()
  t.ok(height > 0)
  const hash = await bcc.getBlockHash(height)
  t.ok(typeof hash === 'string' && hash.length > 0)
  const block = await bcc.getBlockHeader(hash)
  t.ok(block.time > 0)
})
