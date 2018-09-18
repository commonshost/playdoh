const test = require('blue-tape')
const { playdoh } = require('../middleware')
const { promisify } = require('util')
const connect = require('connect')
const http2 = require('http2')
const dnsPacket = require('dns-packet')
const { fetch } = require('./helpers/fetch')
const { encode } = require('base64url')

const dnsPacketQuery = dnsPacket.encode({
  type: 'query',
  id: 0,
  flags: dnsPacket.RECURSION_DESIRED,
  questions: [{
    type: 'A',
    class: 'IN',
    name: 'www.example.com'
  }]
})

let server
let baseUrl
test('Start server with DOH middleware', async (t) => {
  const options = {
    protocol: 'udp4',
    localAddress: '0.0.0.0',
    resolverAddress: '8.8.8.8',
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
    body: dnsPacketQuery
  })

  t.is(response.headers.get('content-type'), 'application/dns-message')
  t.is(response.headers.get(':status'), 200)

  const dnsPacketResponse = dnsPacket.decode(await response.buffer())
  t.is(dnsPacketResponse.type, 'response')
  t.is(dnsPacketResponse.answers.length, 1)

  t.is(response.headers.get('cache-control'), undefined)
})

test('DOH using HTTP/2 GET request', async (t) => {
  const url = `${baseUrl}/?dns=${encode(dnsPacketQuery)}`
  const response = await fetch(url, {
    headers: {
      ':method': 'GET',
      'accept': 'application/dns-message'
    }
  })

  t.is(response.headers.get('content-type'), 'application/dns-message')
  t.is(response.headers.get(':status'), 200)

  const dnsPacketResponse = dnsPacket.decode(await response.buffer())
  t.is(dnsPacketResponse.type, 'response')
  t.is(dnsPacketResponse.answers.length, 1)

  t.is(
    response.headers.get('cache-control'),
    `max-age=${dnsPacketResponse.answers[0].ttl}`
  )
})

test('Stop server', (t) => {
  server.close(t.end)
})
