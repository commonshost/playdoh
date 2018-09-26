const { playdoh } = require('../..')
const { createServer } = require('http2')
const connect = require('connect')
const { dnsServer } = require('./dnsServer')

function annotate (message) {
  return `${process.pid} - ${message}`
}

const app = connect()
app.use(playdoh({ resolverAddress: dnsServer() }))
app.use((request, response, next) => {
  const error = new Error('Should have been handled by DOH')
  console.error(annotate(error))
  next(error)
})
app.use((error, request, response, next) => {
  console.log(annotate(error))
  next(error)
})

const server = createServer(app)
server.listen(8000)
