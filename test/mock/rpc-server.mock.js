const http = require('http')
const {reduce} = require('waterpark')
const methods = [
  'getblock'
]

function rpcServer (handler, host = 'localhost', port = 8332) {
  const server = http.createServer((req, res) => {
    req
      .pipe(reduce.buf((acc, cur) => Buffer.concat([acc, cur])))
      .on('data', data => {
        try {
          const {method, params} = JSON.parse(data.toString())
          if (methods.indexOf(method) < 0) {
            return responder(res, {error: 'Invalid method: ' + method})
          }
          // console.log('[rpcServer] request', method, params)
          handler(method, params, (error, result) => {
            if (error) {
              responder(res, {error})
            } else {
              responder(res, {result})
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

module.exports = rpcServer
