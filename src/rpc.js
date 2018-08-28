const fetch = require('node-fetch')

function rpc ({username, password, ...options} = {}) {
  let read = 0
  let id = 1
  const url = options.url
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  }
  if (username && password) {
    const auth = 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64')
    headers.Authorization = auth
  }

  function exec (method, params = []) {
    const body = {
      jsonrpc: '1.0',
      id: '' + id++,
      method,
      params
    }
    // console.log('[rpc] body', body)
    return fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body)
    })
      .then(res => {
        if (res.statusCode >= 400) {
          throw new Error('HTTP-' + res.statusCode + ' ' + Object.keys(res))
        }
        read += parseInt(res.headers.get('Content-Length'))
        return res.json()
      })
      .then(json => {
        if (json.error) {
          // console.log(json)
          throw new Error(`${json.error.message} (${json.error.code})`)
        }
        // console.log('[rpc] ', json)
        return json.result
      })
  }

  return {
    exec,
    stats: () => read
  }
}

module.exports = rpc
