const test = require('blue-tape')
const {playdoh} = require('../middleware')
const {promisify} = require('util')
const connect = require('connect')
const http2 = require('http2')
const dnsPacket = require('dns-packet')

test('Middleware', async (t) => {
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
  const server = http2.createServer(app)
  await promisify(server.listen).call(server)

  const session = http2.connect(
    `http://localhost:${server.address().port}`
  )
  const request = session.request({
    ':method': 'POST',
    ':path': '/',
    'accept': 'application/dns-message'
  })
  const packet = dnsPacket.encode({
    type: 'query',
    id: 0,
    flags: dnsPacket.RECURSION_DESIRED,
    questions: [{
      type: 'A',
      class: 'IN',
      name: 'www.example.com'
    }]
  })
  request.end(packet)
  request.on('response', async (headers) => {
    t.is(headers['content-type'], 'application/dns-message')
    t.is(headers[':status'], 200)

    const chunks = []
    for await (const chunk of request) {
      chunks.push(chunk)
    }
    const body = Buffer.concat(chunks)
    const response = dnsPacket.decode(body)

    t.is(response.type, 'response')
    t.is(response.answers.length, 1)
    t.is(headers['cache-control'], `max-age=${response.answers[0].ttl}`)

    await promisify(session.close).call(session)
    await promisify(server.close).call(server)
  })
})
