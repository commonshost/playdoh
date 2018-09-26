const test = require('blue-tape')
const cluster = require('cluster')
const { join } = require('path')
const { eventToPromise } = require('./helpers/eventToPromise')
const { fetch } = require('./helpers/fetch')
const { query } = require('./helpers/packet')

const bombardment = 200 // macOS defaults to very low ulimit

test('Barrage workers with requests', async (t) => {
  const workers = []
  cluster.setupMaster({ exec: join(__dirname, 'helpers/worker.js') })
  for (let count = 0; count < 8; count++) {
    const worker = cluster.fork()
    workers.push(worker)
  }
  await Promise.all(workers.map((worker) => {
    return eventToPromise(worker, 'listening')
  }))
  const lookups = []
  for (let count = 0; count < bombardment; count++) {
    const url = `http://localhost:8000/${count}`
    const headers = {
      ':method': 'POST',
      'accept': 'application/dns-message'
    }
    const body = query()
    const request = fetch(url, { headers, body })
    lookups.push(request)
  }
  const responses = await Promise.all(lookups)
  t.ok(responses.every(({ ok }) => ok))
  for (const worker of workers) {
    worker.kill()
  }
  await Promise.all(workers.map((worker) => {
    return eventToPromise(worker, 'exit')
  }))
})
