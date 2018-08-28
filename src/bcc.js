const {range, through} = require('waterpark')
const concurrent = require('parallel-transform')
const Rpc = require('./rpc')

function Bcc (options) {
  const rpc = Rpc(options)

  /*
   * PRIMITIVE RPCs
   */

  const getHeight = () => rpc.exec('getblockcount').then(parseInt)

  const getBlockHash = (height) => rpc.exec('getblockhash', [height])

  const getBlock = (hash) => rpc.exec('getblock', [hash, 2])

  const getRawBlock = (hash) => rpc.exec('getblock', [hash, 0])

  const getBlockHeader = (hash) => rpc.exec('getblock', [hash, 1])

  const getTransaction = (txid) => rpc.exec('getrawtransaction', [txid, 1])

  /*
   * STREAMS
   */

  const blockHashStream = (from, to) => range(from, to)
    .pipe(through.promise(getBlockHash))

  const blockStream = (from, to) => blockHashStream(from, to)
    .pipe(concurrent(7, function (hash, cb) {
      getBlock(hash)
        .then(block => cb(null, block))
        .catch(err => cb(err))
    }))
  // .pipe(throughPromise(getBlock))

  const blockRawStream = (from, to) => blockHashStream(from, to)
    .pipe(concurrent(3, function (hash, cb) {
      getRawBlock(hash)
        .then(block => cb(null, block))
        .catch(err => cb(err))
    }))

  const blockHeaderStream = (from, to) => blockHashStream(from, to)
    .pipe(concurrent(7, function (hash, cb) {
      getBlockHeader(hash)
        .then(head => cb(null, head))
        .catch(err => cb(err))
    }))

  const transactionHashStream = (from, to) => blockHeaderStream(from, to)
    .pipe(through(function (blockHeader, encoding, next) {
      blockHeader.tx.forEach(t => this.push({
        block: blockMeta(blockHeader),
        txHash: t
      }))
      next()
    }))

  const transactionStream = (from, to) => blockStream(from, to)
    .pipe(through(function (block, encoding, next) {
      block.tx.forEach((t, index) => this.push({
        block: blockMeta(block),
        tx: {index, ...t}
      }))
      next()
    }))

  const ioStream = (from, to) => transactionStream(from, to)
    .pipe(through(function ({block, tx}, encoding, next) {
      tx.vin.forEach((input, idx) => this.push(ioData(block, tx, 'in', input, idx)))
      tx.vout.forEach((output, idx) => this.push(ioData(block, tx, 'out', output, idx)))
      next()
    }))

  const scriptStream = (from, to) => ioStream(from, to)
    .pipe(through(function ({block, tx, io}, encoding, next) {
      if (io.type === 'in' && io.coinbase) {
        next()
      } else if (io.type === 'in' && !io.coinbase) {
        next(null, scriptData(block, tx, io.type, io.scriptSig))
      } else {
        next(null, scriptData(block, tx, io.type, io.scriptPubKey))
      }
    }))

  return {
    getHeight,
    getBlockHash,
    getBlock,
    getBlockHeader,
    getTransaction,
    blockStream,
    blockRawStream,
    blockHeaderStream,
    transactionHashStream,
    transactionStream,
    ioStream,
    scriptStream,
    stats: () => rpc.stats()
  }
}

function blockMeta ({hash, time, height}) {
  return {hash, time, height}
}

function txMeta ({txid, index}) {
  return {txid, index}
}

function ioData (block, tx, type, io, index) {
  return {
    block,
    tx: txMeta(tx),
    io: {type, index, ...io}
  }
}

function scriptData (block, tx, type, script) {
  return {
    block,
    tx,
    type,
    script
  }
}

module.exports = Bcc
