import { Client } from 'undici';

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
  return {
    execute: (params: any) => {
      return makeRequest(params)
    }
  }
}
