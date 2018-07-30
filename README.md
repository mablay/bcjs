# BitcoinJS

A simple bitcoind RPC client written in JS.

## Requirements

You need RPC access to a bitcoin daemon and its:
url, username, password.

TODO: Provide the link to a simple bitcoind docker setup.

## Installation

    npm i bcjs

## Usage

    const bcjs = require('bcjs')({
      url: 'http://YOUR_BTC_HOST:8332',
      username: 'YOUR_USERNAME',
      password: 'YOUR_PASSWORD'
    })

    async function main () {
      const height = await bcc.getHeight()
      console.log('height', height)
      const hash = await bcc.getBlockHash(height)
      console.log('hash', hash)
      const block = await bcc.getBlock(hash)
      console.log('block', block.hash) // (new Date(block.time * 1000)).toString())
    }
    main()

## Stream Blocks

    // Get the first 100 Blocks
    bcjs.blockStream(0, 100)
      .on('data', block => console.log(block.hash))

## TODO

* [x] Implement basic RPC tests
* [ ] Implement streaming tests
* [ ] Concurrent RPCs using transform streams
* [ ] Beautify documentation
* [ ] Composable pattern for BCC client
* [ ] Concurrent queue for RPC client
* [ ] Separate JSON-RPC from BCC functionality
