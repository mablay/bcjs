const rpc = require('./rpc')
// const start = Date.now()
const log = (...args) => {
  // const time = 't: ' + (Date.now() - start)
  // console.log(...[...args, time])
}

// const queue = require('./util/ordered-queue')
const comperator = (a, b) => a[0] - b[0]

function fastRpc ({concurrency = 1, ...options} = {}) {
  const {exec} = rpc(options)
  const queue = [] // requests to be done
  const store = [] // responses that came out of sequence
  let index = 0 // index used to order future results
  let sequence = 0 // stating the last resolved result index
  let capacity = concurrency

  function orderedExec (method, params = []) {
    return new Promise((resolve, reject) => {
      log('[RPC] store[%d] = ', queue.length, method, params)
      queue.push([method, params, resolve, reject])
      executeEventually()
    })
  }

  function resolveEventually (order, cb) {
    if (order === sequence) {
      // no need to defer it, resolve immediately
      sequence++
      cb()
      // Check if deferred results continue the sequence.
      checkDeferredResults()
    } else {
      // intermediate results are outstanding to keep the sequence in order
      // Defer the result
      store.push([order, cb])
      store.sort(comperator)
    }

    capacity++
    log('[RPC] received %s, remaining capacity: %d', order, capacity)
    executeEventually()
  }

  function checkDeferredResults () {
    while (store.length && store[0][0] === sequence) {
      sequence++
      store.shift()[1]() // remove from defer-store, get callback, execute callback
    }
  }

  function executeEventually () {
    if (!capacity || !queue.length) return
    capacity--
    const order = index++
    const [method, params, resolve, reject] = queue.shift()
    log('[RPC] request %d, remaining capacity: %d', order, capacity)
    exec(method, params)
      .then(res => {
        resolveEventually(order, () => resolve(res))
      })
      .catch(err => {
        resolveEventually(order, () => reject(err))
      })
  }

  return {exec: orderedExec}
}

module.exports = fastRpc
