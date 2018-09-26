const http2 = require('http2')
const { promisify } = require('util')
const { eventToPromise } = require('./eventToPromise')
const { URL } = require('url')

function readAll (stream, chunks) {
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => chunks.push(chunk))
    stream.on('error', reject)
    stream.once('end', resolve)
  })
}

async function fetch (url, options) {
  const { origin, pathname, search } = new URL(url)
  const session = http2.connect(origin)
  const reqHeaders = {
    ...options.headers,
    ...{ ':path': pathname + search }
  }
  const request = session.request(reqHeaders)
  request.end(options.body)
  const headers = await eventToPromise(request, 'response')
  const chunks = []
  await readAll(request, chunks)
  await promisify(session.close).call(session)
  const body = Buffer.concat(chunks)
  chunks.length = 0
  return {
    ok: headers[':status'] < 400,
    get headers () { return new Map(Object.entries(headers)) },
    async buffer () { return body },
    async text () { return body.toString() },
    async json () { return JSON.parse(body.toString()) }
  }
}

module.exports.fetch = fetch
