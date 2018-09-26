const { getServers } = require('dns')

module.exports.dnsServer = function () {
  const dnsServers = getServers()
  if (dnsServers.length === 0) {
    throw new Error('No dns servers available.')
  }
  const randomIndex = Math.floor(Math.random() * dnsServers.length)
  return dnsServers[randomIndex]
}
