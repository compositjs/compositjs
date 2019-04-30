

const HttpErrors = require('http-errors');

module.exports.serviceNotAvaliable = (err, options = {}) => {
  const msg = `Service not available. See error object or debug for more info. ${err.message || ''}`;
  return Object.assign(
    new HttpErrors.ServiceUnavailable(msg),
    {
      code: 'SERVICE_NOT_AVAILABLE',
    },
    options,
  );
};

module.exports.serviceTimedOut = (err, options = {}) => {
  const msg = `Service time out. See error object or debug for more info. ${err.message || ''}`;
  return Object.assign(
    new HttpErrors.RequestTimeout(msg),
    {
      code: 'SERVICE_TIME_OUT',
    },
    options,
  );
};

module.exports.invalidParameters = (err, options = {}) => {
  const msg = `Invalid parameters. See error object or debug for more info. ${err.message && ''}`;
  return Object.assign(
    new HttpErrors.BadRequest(msg),
    {
      code: 'INVALID_PARAMETER',
      details: options,
    },
  );
};
