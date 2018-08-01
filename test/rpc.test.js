const test = require('tape')
const host = require('../config/local')
const bcc = require('../')(host)

test('Basic RPCs', async t => {
  t.plan(3)
  const height = await bcc.getHeight()
  t.ok(height > 0)
  const hash = await bcc.getBlockHash(height)
  t.ok(typeof hash === 'string' && hash.length > 0)
  const block = await bcc.getBlockHeader(hash)
  t.ok(block.time > 0)
})

test('streaming blocks', async t => {
  t.plan(11)
  bcc.blockStream(100001, 100010)
    .on('data', block => t.ok(block.hash, block.hash))
    .on('end', () => t.ok(true, 'end'))
})

test('streaming scripts', async t => {
  bcc.scriptStream(100001, 100001)
    .on('data', script => {
      t.ok(script, JSON.stringify(script.script.asm))
    })
    .on('finish', () => t.end())
})
