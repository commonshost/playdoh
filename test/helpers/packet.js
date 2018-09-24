const dnsPacket = require('dns-packet')

module.exports.query = (packet = {}) => dnsPacket.encode({
  type: 'query',
  id: 0,
  flags: dnsPacket.RECURSION_DESIRED,
  questions: [{
    type: 'A',
    class: 'IN',
    name: 'www.example.com'
  }],
  ...packet
})

module.exports.response = (packet = {}) => dnsPacket.encode({
  id: 0,
  type: 'response',
  answers: [{
    type: 'A',
    class: 'IN',
    flush: true,
    name: 'www.example.com',
    data: '10.10.10.10'
  }],
  ...packet
})
