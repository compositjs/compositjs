import { Client } from 'undici';
const Hystrixjs = require('hystrixjs');
const HystrixCommand: any = Hystrixjs.commandFactory;

const clients: any = {}

const circuitBreakerDefaults: any = {
  errorCodes: '503',
  windowLength: 30000,
  numBuckets: 10,
  timeout: 10000,
  errorThreshold: 50,
  volumeThreshold: 5,
};

const makeRequest = (opts: any) => {
  if (!clients[opts.host])
    clients[opts.host] = new Client(opts.host);

  return clients[opts.host].request(opts);
}

export function getServiceBreaker(service: any) {
  const options = Object.assign({}, circuitBreakerDefaults, service.circuitBreaker);
  return HystrixCommand.getOrCreate(service.info.name)
    .timeout(options.timeout)
    .statisticalWindowLength(options.windowLength)
    .statisticalWindowNumberOfBuckets(options.numBuckets)
    .circuitBreakerErrorThresholdPercentage(options.errorThreshold)
    .circuitBreakerRequestVolumeThreshold(options.volumeThreshold)
    .circuitBreakerSleepWindowInMilliseconds(options.timeout)
    .run(makeRequest)
    .errorHandler((err: any) => {
      if (err && (options.errorCodes.indexOf((err.statusCode || 503).toString()) || err.code === 'ENOTFOUND')) {
        return err; // just return it, to confirm it is a valid error for circuit breaker
      }
      return null;
    })
    .build();
}
