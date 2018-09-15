#!/usr/bin/env node

const http = require('http')
const pino = require('pino')
const doh = require('./lib/doh')

const log = pino()
const server = http.createServer(( req, res ) => {
  return doh.server(req, res)
})

log.info("starting doh")
server.listen(8212)
