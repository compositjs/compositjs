

import * as HttpErrors from 'http-errors';

export function serviceNotAvaliable( err: any, options: any = {}) {
  const msg = `Service not available. See error object or debug for more info. ${err.message || ''}`;
  return Object.assign(
    new HttpErrors.ServiceUnavailable(msg),
    {
      code: 'SERVICE_NOT_AVAILABLE',
    },
    options,
  );
};

export function serviceTimedOut( err: any, options: any = {}) {
  const msg = `Service time out. See error object or debug for more info. ${err.message || ''}`;
  return Object.assign(
    new HttpErrors.RequestTimeout(msg),
    {
      code: 'SERVICE_TIME_OUT',
    },
    options,
  );
};

export function invalidParameters( err: any, options: any = {}) {
  const msg = `Invalid parameters. See error object or debug for more info. ${err.message && ''}`;
  return Object.assign(
    new HttpErrors.BadRequest(msg),
    {
      code: 'INVALID_PARAMETER',
      details: options,
    },
  );
};
