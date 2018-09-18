const { createSocket } = require('dgram')
const { toBuffer } = require('base64url')
const { decode } = require('dns-packet')

const {
  BadRequest,
  MethodNotAllowed,
  PayloadTooLarge,
  InternalServerError,
  BadGateway,
  GatewayTimeout,
  HTTPVersionNotSupported
} = require('http-errors')

const {
  constants: {
    HTTP2_HEADER_ACCEPT,
    HTTP2_HEADER_CACHE_CONTROL,
    HTTP2_HEADER_CONTENT_LENGTH,
    HTTP2_HEADER_CONTENT_TYPE,
    HTTP2_METHOD_GET,
    HTTP2_METHOD_POST
  }
} = require('http2')

const dohMediaType = 'application/dns-message'
const dohMaximumMessageLength = 65535
const dohMinimumHttpVersionMajor = 2

function smallestTtl (min, { ttl }) {
  return ttl < min ? ttl : min
}

module.exports.playdoh =
function playdoh ({
  protocol = 'udp4', // or 'udp6'
  localAddress = 'localhost', // Set empty string for 0.0.0.0 or ::0
  resolverAddress = '', // Defaults to 127.0.0.1 or ::1
  resolverPort = 53,
  timeout = 10000
} = {}) {
  return async function playdoh (request, response, next) {
    if (request.headers[HTTP2_HEADER_ACCEPT] !== dohMediaType) {
      return next()
    }
    if (request.httpVersionMajor < dohMinimumHttpVersionMajor) {
      return next(new HTTPVersionNotSupported())
    }

    const dnsMessage = []
    switch (request.method) {
      case HTTP2_METHOD_GET:
        const { url } = request
        const dns = new URLSearchParams(url.substr(url.indexOf('?'))).get('dns')
        if (!dns) {
          return next(new BadRequest())
        }
        let decoded
        try {
          decoded = toBuffer(dns)
        } catch (error) {
          return next(new BadRequest())
        }
        if (decoded.length > dohMaximumMessageLength) {
          return next(new PayloadTooLarge())
        }
        dnsMessage.push(decoded)
        break
      case HTTP2_METHOD_POST:
        let totalLength = 0
        for await (const chunk of request) {
          totalLength += chunk.length
          if (totalLength > dohMaximumMessageLength) {
            return next(new PayloadTooLarge())
          }
          dnsMessage.push(chunk)
        }
        break
      default:
        return next(new MethodNotAllowed())
    }

    let socket
    try {
      socket = createSocket(protocol)
      socket.bind(localAddress)
    } catch (error) {
      return next(new InternalServerError())
    }

    socket.once('error', () => next(new BadGateway()))

    socket.once('listening', () => {
      const timer = setTimeout(() => {
        socket.close()
        next(new GatewayTimeout())
      }, timeout)
      socket.once('close', () => clearTimeout(timer))
      socket.send(dnsMessage, resolverPort, resolverAddress)
      dnsMessage.length = 0
    })

    socket.on('message', (message, { size, port, address }) => {
      if (address === resolverAddress && port === resolverPort) {
        if (request.method === HTTP2_METHOD_GET) {
          let answers
          try {
            ({ answers } = decode(message))
          } catch (error) {
            return next(new BadGateway())
          }
          const ttl = answers.reduce(smallestTtl, Infinity)
          if (Number.isFinite(ttl)) {
            response.setHeader(HTTP2_HEADER_CACHE_CONTROL, `max-age=${ttl}`)
          }
        }
        response.setHeader(HTTP2_HEADER_CONTENT_LENGTH, size)
        response.setHeader(HTTP2_HEADER_CONTENT_TYPE, dohMediaType)
        response.end(message)
        socket.close()
      }
    })
  }
}
