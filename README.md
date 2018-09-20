# playdoh 🛢

[![Build Status](https://travis-ci.org/qoelet/playdoh.svg?branch=master)](https://travis-ci.org/qoelet/playdoh)
[![npm version](https://badge.fury.io/js/playdoh.svg)](https://badge.fury.io/js/playdoh)

Middleware for Node.js web servers to expose DNS over HTTPS (DoH).

Implemented draft specification: *DNS Queries over HTTPS (DoH)* version 14 [[draft-ietf-doh-dns-over-https-14](https://tools.ietf.org/html/draft-ietf-doh-dns-over-https-14)].

## Usage

Note: HTTP/2 is the minimum *recommended* version of HTTP for use with DoH.

```js
const { playdoh } = require('playdoh')
const options = {
  // Defaults
  protocol: 'udp4',
  localAddress: 'localhost',
  resolverAddress: '',
  resolverPort: 53,
  timeout: 10000
}
const middleware = playdoh(options)
```

## Options

**`protocol`** - Defaults to `udp4`. Can be either `udp4` or `udp6` to indicate whether to connect to the resolver over IPv4 or IPv6 respectively.

**`localAddress`** - Defaults to `localhost`. The UDP socket is bound to this address. Use a local-only address (`localhost`, `127.0.0.1` or `::1`) to only accept local DNS resolver responses. Set to empty string to bind to all addresses (`0.0.0.0` or `::0`) and accept remote DNS resolver responses.

**`resolverAddress`** - Defaults to `127.0.0.1` or `::1`. The IP address of the DNS resolver. Queries are sent via UDP. See also: [List of public DNS service operators](https://en.wikipedia.org/wiki/Public_recursive_name_server) on Wikipedia.

**`resolverPort`** - Defaults to `53`. The port of the DNS resolver.

**`timeout`** - Defaults to `10000`. Number of milliseconds to wait for a response from the DNS resolver.

### Connect

```js
const connect = require('connect')
const { createSecureServer } = require('http2')
const app = connect()
app.use(middleware)
const options = {
  key: fs.readFileSync('server-key.pem'),
  cert: fs.readFileSync('server-cert.pem')
}
const server = createSecureServer(options, app)
server.listen(443)
```

### Fastify

```js
const fastify = require('fastify')({
  http2: true,
  https: {
    key: fs.readFileSync('server-key.pem'),
    cert: fs.readFileSync('server-cert.pem')
  }
})
fastify.use(middleware)
fastify.listen(443)
```

## Credits

Made by [Kenny Shen](https://www.machinesung.com) and [Sebastiaan Deckers](https://twitter.com/sebdeckers) for 🐑 [Commons Host](https://commons.host).
