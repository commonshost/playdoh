const assert = require('assert')
const http = require('http')
const MockReq = require('mock-req')
const MockRes = require('mock-res')
const url= require('url')
const doh = require('../lib/doh.js')

describe('validateContentType', function () {
  it('should return true if valid', function () {
    given = doh.validateContentType('application/dns-message')
    assert.equal(given, true)
  })
})

describe('validateMethod', function () {
  it('should return true if valid', function () {
    given = doh.validateMethod('GET')
    assert.equal(given, true)

    given = doh.validateMethod('POST')
    assert.equal(given, true)
  })
})

describe('validatePayload', function () {
  it('should return true if it does not exceed size limit', function () {
    given = doh.validatePayload('AAABAAABAAAAAAAAAWE-NjJjaGFyYWN0ZXJsYWJl bC1tYWtlcy1iYXNlNjR1cmwtZGlzdGluY3QtZnJvbS1zdGFuZGFyZC1iYXNlNjQHZXhhbXBsZQNjb20AAAEAAQ')
    assert.equal(given, true)
  })

  it('should return false if it does exceed size limit', function () {
    given = doh.validatePayload('AAABAAABAAAAAAAAAWE-NjJjaGFyYWN0ZXJsYWJl bC1tYWtlcy1iYXNlNjR1cmwtZGlzdGluY3QtZnJvbS1zdGFuZGFyZC1iYXNlNjQHZXhhbXBsZQNjb20AAAEAAQ'.repeat(10000))
    assert.equal(given, false)
  })
})

describe('validateGetParam', function () {
  it('should return true if param exists', function () {
    given = doh.validateGetParam(url.parse('/dns-query?dns=foo', true))
    assert.equal(given, true)
  })

  it('should return false if param does not exists', function () {
    given = doh.validateGetParam(url.parse('/dns-query', true))
    assert.equal(given, false)
  })
})

describe('a valid client GET request', function () {
  it('should return 200', function () {
    req = new MockReq({
      method: 'GET',
      url: '/dns-query?dns=AAABAAABAAAAAAAAA3d3dwdleGFtcGxlA2NvbQAAAQAB',
      headers: {
        'accept': 'application/dns-message'
      }
    })
    res = new MockRes()
    given = doh.server(req, res)

    assert.equal(given.statusCode, 200)
  })
})

describe('a valid client POST request', function () {
  it('should return 200', function () {
    req = new MockReq({
      method: 'POST',
      url: '/dns-query',
      headers: {
        'content-type': 'application/dns-message'
      }
    })
    res = new MockRes()
    given = doh.server(req, res)
    given.on('data', function () {
      assert.equal(given.statusCode, 200)
    })
  })
})
