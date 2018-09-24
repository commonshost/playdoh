const test = require('blue-tape')
const { playdoh } = require('..')
const { promisify } = require('util')
const connect = require('connect')
const http2 = require('http2')
const { decode } = require('dns-packet')
const { fetch } = require('./helpers/fetch')
const { createSocket } = require('dgram')
const { query, response } = require('./helpers/packet')

let resolver
test('Start mock resolver', async (t) => {
  resolver = createSocket('udp4')
  resolver.bind()
  resolver.once('message', (message, { port, address }) => {
    const { id } = decode(message)
    t.isNot(id, dohRequestId)
    const res = response({ id })
    resolver.send(res, port, address)
  })
})

let server
let baseUrl
test('Start server with DOH middleware', async (t) => {
  const options = {
    resolverPort: resolver.address().port
  }
  const middleware = playdoh(options)

  const app = connect()
  app.use(middleware)
  server = http2.createServer(app)
  await promisify(server.listen).call(server)
  const { port } = server.address()
  baseUrl = `http://localhost:${port}`
})

let dohRequestId
test('DOH using HTTP/2 POST request', async (t) => {
  dohRequestId = Math.floor(Math.random() * 2 ** 16)

  const response = await fetch(baseUrl, {
    headers: {
      ':method': 'POST',
      'accept': 'application/dns-message'
    },
    body: query({ id: dohRequestId })
  })

  const { id } = decode(await response.buffer())
  t.is(id, dohRequestId)
})

test('Stop server', (t) => {
  server.close(t.end)
})

test('Stop mock resolver', (t) => {
  resolver.close(t.end)
})
