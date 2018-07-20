const {range, throughPromise, through} = require('waterpark')
const Rpc = require('./rpc')

function Bcc (options) {
  const rpc = Rpc(options)

  /*
   * PRIMITIVE RPCs
   */

  const getHeight = () => rpc.exec('getblockcount').then(parseInt)

  const getBlockHash = (height) => rpc.exec('getblockhash', [height])

  const getBlock = (hash) => rpc.exec('getblock', [hash, 2])

  const getBlockHeader = (hash) => rpc.exec('getblock', [hash, 1])

  /*
   * STREAMS
   */

  const blockHashStream = (from, to) => range(from, to)
    .pipe(throughPromise(getBlockHash))

  const blockStream = (from, to) => blockHashStream(from, to)
    .pipe(throughPromise(getBlock))

  const blockHeaderStream = (from, to) => blockHashStream(from, to)
    .pipe(throughPromise(getBlockHeader))

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
      block.tx.forEach(t => this.push({
        block: blockMeta(block),
        tx: t
      }))
      next()
    }))

  const ioStream = (from, to) => transactionStream(from, to)
    .pipe(through(function ({block, tx}, encoding, next) {
      tx.vin.forEach(i => this.push(ioData(block, tx, 'in', i)))
      tx.vout.forEach(o => this.push(ioData(block, tx, 'out', o)))
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
    blockStream,
    blockHeaderStream,
    transactionHashStream,
    transactionStream,
    ioStream,
    scriptStream
  }
}

function blockMeta ({hash, time, height}) {
  return {hash, time, height}
}

function txMeta ({txid}) {
  return {txid}
}

function ioData (block, tx, type, io) {
  return {
    block,
    tx: txMeta(tx),
    io: {type, ...io}
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
