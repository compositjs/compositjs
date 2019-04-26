"use strict";

const got = require('got');
const Hystrixjs = require('hystrixjs');
const HystrixCommand = Hystrixjs.commandFactory

const circuitBreakerDefaults = {
  errorCodes: '503',
  windowLength: 30000,
  numBuckets: 10,
  timeout: 10000,
  errorThreshold: 50,
  volumeThreshold: 5
}


module.exports = function getServiceBreaker(service) {

  const options = Object.assign({}, circuitBreakerDefaults, service.circuitBreaker)

  return HystrixCommand.getOrCreate(service.info.name)
    .timeout(options.timeout)
    .statisticalWindowLength(options.windowLength)
    .statisticalWindowNumberOfBuckets(options.numBuckets)
    .circuitBreakerErrorThresholdPercentage(options.errorThreshold)
    .circuitBreakerRequestVolumeThreshold(options.volumeThreshold)
    .circuitBreakerSleepWindowInMilliseconds(options.timeout)
    .run(got)
    .errorHandler((err) => {
      if (err && (~options.errorCodes.indexOf((err.statusCode || 503).toString()) || err.code === 'ENOTFOUND')) {
        return err // just return it, to confirm it is a valid error for circuit breaker
      }
    })
    .build()
}
