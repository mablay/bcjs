const http = require('http')
const {reduce} = require('waterpark')
const fs = require('fs')
const Path = require('path')
const methods = [
  'getblock',
  'getblockcount',
  'getblockhash'
]

function rpcServer (handler, host = 'localhost', port = 8332) {
  const server = http.createServer((req, res) => {
    req
      .pipe(reduce.buf((acc, cur) => Buffer.concat([acc, cur])))
      .on('data', data => {
        try {
          const {method, params, id} = JSON.parse(data.toString())
          if (methods.indexOf(method) < 0) {
            return responder(res, {error: 'Invalid method: ' + method})
          }
          // console.log('[rpcServer] request', method, params)
          handler(method, params, (error, result) => {
            if (error) {
              responder(res, {error, id})
            } else {
              responder(res, {result, id})
            }
          })
        } catch (error) {
          // console.error('[test] RPC request error', e)
          responder(res, {error})
        }
      })
  })
  server.listen(port, host, () => {})
  return server
}

function responder (res, body) {
  res.writeHead(200, {'Content-Type': 'application/json'})
  res.end(JSON.stringify(body, null, 4))
}

rpcServer.static = (dir, host, port) => {
  function handler (method, params = [], cb) {
    const para = (params.length) ? '-' + params.join('-') : ''
    const filename = `${method}${para}.json`
    const path = Path.join(dir, filename)
    fs.readFile(path, (err, json) => {
      if (err) return cb(err)
      try {
        const data = JSON.parse(json)
        if (data.result) {
          return cb(null, data.result)
        }
        return cb(data.error)
      } catch (err) {
        cb(err)
      }
    })
  }

  return rpcServer(handler, host, port)
}

module.exports = rpcServer
