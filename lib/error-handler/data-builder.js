
module.exports.fillStatusCode = fillStatusCode = (err, data) => {
  data.statusCode = err.statusCode || err.status;
  if (!data.statusCode || data.statusCode < 400)
    data.statusCode = 500;
};

module.exports.buildErrorResponseData = (err, opts = {}) => {

  if (Array.isArray(err)) {    
    return serializeArrayOfErrors(err, opts);
  }

  const data = Object.create(null);
  fillStatusCode(err, data);

  fillRequestErrorData(err, data);

  return data;
};

module.exports.serializeArrayOfErrors = (errors, options) => {
  const details = errors.map(e => buildErrorResponseData(e, options));
  return {
    statusCode: 500,
    details: details,
  };
}

function fillRequestErrorData(err, data) {
  data.name = err.name;
  data.message = err.message;
  data.code = err.code;
  data.details = err.details;
}