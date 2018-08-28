const test = require('tape')
// const host = require('../config/local')
const Path = require('path')
const bcc = require('../')({url: 'http://localhost:8332'})
const rpcServer = require('./mock/rpc-server.mock')
const staticRpcServer = () => rpcServer.static(Path.join('test', 'fixtures'), 'localhost', 8332)

test('Basic RPCs', async t => {
  const server = staticRpcServer()
  t.plan(3)
  const height = await bcc.getHeight()
  t.equal(height, 10, 'height should be 10')
  const hash = await bcc.getBlockHash(height)
  t.equal(hash, '000000002c05cc2e78923c34df87fd108b22221ac6076c18f3ade378a4d915e9', 'hash should be 000000002c05cc2e78923c34df87fd108b22221ac6076c18f3ade378a4d915e9')
  const block = await bcc.getBlockHeader(hash)
  server.close()
  t.equal(block.height, 10, 'should provide block with height 10')
})

test('streaming blocks', async t => {
  const server = staticRpcServer()
  t.plan(12)
  bcc.blockHeaderStream(0, 10)
    .on('data', block => t.ok(block.hash, block.hash))
    .on('end', () => {
      server.close()
      t.ok(true, 'end')
    })
})

test('streaming scripts', async t => {
  const server = staticRpcServer()
  bcc.scriptStream(100001, 100001)
    .on('data', script => {
      t.ok(script, JSON.stringify(script.script.asm))
    })
    .on('finish', () => {
      server.close()
      t.end()
    })
})
