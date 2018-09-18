function eventToPromise (emitter, success, failure = 'error') {
  return new Promise((resolve, reject) => {
    function onSuccess (value) {
      emitter.off(failure, onFailure)
      resolve(value)
    }
    function onFailure (error) {
      emitter.off(success, onSuccess)
      reject(error)
    }
    emitter.once(success, onSuccess)
    emitter.once(failure, onFailure)
  })
}

module.exports.eventToPromise = eventToPromise
