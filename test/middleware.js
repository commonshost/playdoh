const test = require('blue-tape')
const { playdoh } = require('..')
const { promisify } = require('util')
const connect = require('connect')
const http2 = require('http2')
const { decode } = require('dns-packet')
const { fetch } = require('./helpers/fetch')
const { encode } = require('base64url')
const { query } = require('./helpers/packet')
const { dnsServer } = require('./helpers/dnsServer')

let server
let baseUrl
test('Start server with DOH middleware', async (t) => {
  const options = {
    protocol: 'udp4',
    localAddress: '0.0.0.0',
    resolverAddress: dnsServer(),
    resolverPort: 53,
    timeout: 5000
  }
  const middleware = playdoh(options)

  const app = connect()
  app.use(middleware)
  server = http2.createServer(app)
  await promisify(server.listen).call(server)
  const { port } = server.address()
  baseUrl = `http://localhost:${port}`
})

test('DOH using HTTP/2 POST request', async (t) => {
  const response = await fetch(baseUrl, {
    headers: {
      ':method': 'POST',
      'accept': 'application/dns-message'
    },
    body: query()
  })

  t.is(response.headers.get('content-type'), 'application/dns-message')
  t.is(response.headers.get(':status'), 200)

  const { type, answers } = decode(await response.buffer())
  t.is(type, 'response')
  t.is(answers.length, 1)

  t.is(response.headers.get('cache-control'), undefined)
})

test('DOH using HTTP/2 GET request', async (t) => {
  const url = `${baseUrl}/?dns=${encode(query())}`
  const response = await fetch(url, {
    headers: {
      ':method': 'GET',
      'accept': 'application/dns-message'
    }
  })

  t.is(response.headers.get('content-type'), 'application/dns-message')
  t.is(response.headers.get(':status'), 200)

  const { type, answers } = decode(await response.buffer())
  t.is(type, 'response')
  t.is(answers.length, 1)

  t.is(
    response.headers.get('cache-control'),
    `max-age=${answers[0].ttl}`
  )
})

test('Stop server', (t) => {
  server.close(t.end)
})
