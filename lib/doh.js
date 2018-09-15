const base64url = require( 'base64url' )
const dgram = require( 'dgram' )
const dnsPacket = require( 'dns-packet' )
const pino = require( 'pino' )
const url = require( 'url' )

const BAD_REQUEST = 400
const QUERY_EXCEEDED_LIMIT = 413
const NOT_FOUND = 404
const UNSUPPORTED_CONTENT_TYPE = 415
const log = pino()
const socket = dgram.createSocket( 'udp4' )

function badRequest( res ) {
  res.statusCode = BAD_REQUEST;
  res.write( 'bad request' )
  res.end()
  return res
}

function notFound( res ) {
  res.statusCode = NOT_FOUND;
  res.write( 'not found' )
  res.end()
  return res
}

function queryExceededLimit( res ) {
  res.statusCode = QUERY_EXCEEDED_LIMIT;
  res.write( 'query exceeded limit' )
  res.end()
  return res
}

function notSupported( res ) {
  res.statusCode = UNSUPPORTED_CONTENT_TYPE;
  res.write( 'unsupported content type' )
  res.end()
  return res
}

/*       */
function renderRes( message        , res                 ) {
  messageDecoded = dnsPacket.decode( message )
  res.statusCode = 200
  res.writeHead(200, {
    'Content-Type': 'application/dns-message',
    'Content-Length': Buffer.byteLength(message),
    'Cache-Control': messageDecoded['answers'][0]['ttl']
  })
  res.write( message )
  res.end()
  return res
}

/* @flow */
function mkDnsQuery( buf         ) {
  return new Promise(function( resolve, reject ) {
    socket.send(buf, 0, buf.length, 53, '192.168.1.1' )
    socket.on( 'message', function( message ) {
      resolve( message )
    })
    socket.on( 'error', function( err ) {
      reject( err );
    })
  })
}

/* @flow */
function validateGetParam( u      )          {
  if( u['query'] )
    if( u['query']['dns'] )
      return true
  return false
}

/* @flow */
function validateContentType( c         )          {
  if( c == 'application/dns-message' )
    return true
  return false
}

/* @flow */
function validateMethod( m         )          {
  if( m == 'GET' || m == 'POST' )
    return true
  return false
}

function validatePayload( p         )          {
  if( Buffer.byteLength( p, 'utf8' ) >= 65535 )
    return false
  return true
}

function server(req, res) {
  if( req.url.startsWith( '/dns-query' ) ) {
    if( !this.validateMethod( req.method ) )
      return badRequest( res )
    if( req.method == 'POST' && !validateContentType( req.headers['content-type'] ) )
      return notSupported( res )
    if( req.method == 'GET'
        && !validateContentType( req.headers['accept'] ) )
      return notSupported( res )
    if( req.method == 'GET'
        && !validateGetParam( url.parse( req.url, true ) ) )
      return badRequest( res )
    if( req.method == 'GET' ) {
      buf = base64url.toBuffer( url.parse( req.url, true )['query']['dns'] )
      if( !validatePayload( buf ) )
        return queryExceededLimit( res )
      if( !buf )
        return badRequest( res )
      mkDnsQuery( buf ).then(function( message ) {
        res = renderRes( message, res )
        return res
      }, function( err ) {
        log.error( err )
        res.statusCode = 500
        res.end()
        return res
      })
    } else {
      buf = []
      req.on( 'data', function(chunk) {
        buf.push( chunk )
      })
      req.on( 'end', function() {
        buf = Buffer.concat( buf )
        if( !validatePayload( buf ) )
          return queryExceededLimit( res )
        mkDnsQuery( buf ).then(function( message ) {
          res = renderRes( message, res )
          return res
        }, function( err ) {
          log.error( err )
          res.statusCode = 500
          res.end()
          return res
        })
      })
    }

    return res
  }

  return notFound( res )
}

module.exports = {
  server: server,
  validateContentType: validateContentType,
  validateGetParam: validateGetParam,
  validateMethod: validateMethod,
  validatePayload: validatePayload
}
