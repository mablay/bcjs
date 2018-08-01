const test = require('tape')
const RPC = require('../src/fast-rpc')
const url = 'http://localhost:8332'
const rpcServer = require('./mock/rpc-server.mock')

test('RPC request to mock server', t => {
  const bitcoind = rpcServer((method, params, cb) => {
    setTimeout(() => cb(null, {method, params, msg: 'hello'}), 100)
  })

  const rpc = RPC({url})
  rpc.exec('getblock')
    .then(data => {
      t.pass(JSON.stringify(data))
    })
    .catch(err => {
      t.fail(err)
    })
    .then(() => {
      t.end()
      bitcoind.close()
    })
})

test.only('[RPC] multiple requests preserving order', t => {
  const shuffle = [
    100,
    800,
    200,
    300
  ]
  const expected = 'abcd'.split('')
  const bitcoind = rpcServer((method, params, cb) => {
    // console.log('[test] bitoind handler', method, params, shuffle.length)
    const delay = shuffle.shift()
    setTimeout(() => cb(null, params[0]), delay)
  })

  function confirmNext (data) {
    t.equal(data, expected.shift(), 'data passed: ' + data)
  }

  const rpc = RPC({url, concurrency: 2})

  // rpc concurrently executes requests up to 'concurrency'
  // and queues the rest.
  // results and errors will be resolved in order.
  Promise.all([
    rpc.exec('getblock', ['a']).then(confirmNext),
    rpc.exec('getblock', ['b']).then(confirmNext),
    rpc.exec('getblock', ['c']).then(confirmNext),
    rpc.exec('getblock', ['d']).then(confirmNext)
  ]).catch(err => t.fail(err))
    .then(() => {
      t.end()
      bitcoind.close()
    })
})
