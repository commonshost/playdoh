# playdoh 🛢

[![Build Status](https://travis-ci.org/qoelet/playdoh.svg?branch=master)](https://travis-ci.org/qoelet/playdoh)
[![npm version](https://badge.fury.io/js/playdoh.svg)](https://badge.fury.io/js/playdoh)

Middleware for Node.js web servers to expose DNS over HTTPS (DoH).

Implemented draft specification: *DNS Queries over HTTPS (DoH)* version 14 [[draft-ietf-doh-dns-over-https-14](https://tools.ietf.org/html/draft-ietf-doh-dns-over-https-14)].

## Demo: Try it with Firefox

Playdoh powers the 🐑 [Commons Host](https://commons.host) DNS over HTTPS service.

Configure Firefox to use Commons Host DNS over HTTPS in 3 steps.

0. Use Firefox 62+
1. Browse to: `about:config`
1. Search: `network.trr.`
1. Configure:

   | Preference Name | Value |
   |-|-|
   | `network.trr.mode` | 2 |
   | `network.trr.uri` | https://commons.host |

Done! You are now using the Trusted Recursive Resolver (TRR). Enjoy a more private and secure Internet.

![Firefox settings](./docs/firefox-settings.png)

## Usage

Note: HTTP/2 is the minimum *recommended* version of HTTP for use with DoH.

```js
const { playdoh } = require('playdoh')

// Defaults
const options = {
  // udp4 (IPv4) or udp6 (IPv6)
  protocol: 'udp4',

  // Defaults to 0.0.0.0 (udp4) or ::0 (udp6)
  localAddress: '',

  // Defaults to 127.0.0.1 (udp4) or ::1 (udp6)
  resolverAddress: '',

  // Standard DNS port
  resolverPort: 53,

  // Maximum DNS lookup duration
  timeout: 10000
}

const middleware = playdoh(options)
```

## Returns: `middleware(request, response, next)`

The middleware function follows the Node.js convention and is compatible with most popular web server frameworks.

## Options

### `protocol`

Default: `udp4`

Can be either `udp4` or `udp6` to indicate whether to connect to the resolver over IPv4 or IPv6 respectively.

### `localAddress`

Default: `0.0.0.0` (IPv4) or `::0` (IPv6)

The UDP socket is bound to this address.

Use a loopback IP address (`''` empty string, `localhost`, `127.0.0.1`, or `::1`) to only accept local DNS resolver responses.

Use a wildcard IP address (`0.0.0.0` or `::0`) to accept remote DNS resolver responses.

### `resolverAddress`

Default: `127.0.0.1` (IPv4) or `::1` (IPv6)

The IP address of the DNS resolver. Queries are sent via UDP.

See also: [List of public DNS service operators](https://en.wikipedia.org/wiki/Public_recursive_name_server) on Wikipedia.

### `resolverPort`

Default: `53`

The port of the DNS resolver.

### `timeout`

Default: `10000`

Number of milliseconds to wait for a response from the DNS resolver.

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

## References

- https://dnsprivacy.org/wiki/display/DP/DNS+Privacy+Clients#DNSPrivacyClients-DOH

- https://github.com/curl/curl/wiki/DNS-over-HTTPS

## Credits

Made by [Kenny Shen](https://www.machinesung.com) and [Sebastiaan Deckers](https://twitter.com/sebdeckers) for 🐑 [Commons Host](https://commons.host).
