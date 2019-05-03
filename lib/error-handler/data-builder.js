
/* eslint no-param-reassign: ["error", { "props": false }] */
const fillStatusCode = (err, data) => {
  data.statusCode = err.statusCode || err.status;
  if (!data.statusCode || data.statusCode < 400) { data.statusCode = 500; }
};

const fillRequestErrorData = (err, data) => {
  data.name = err.name;
  data.message = err.message;
  data.code = err.code;
  data.details = err.details;
};

const buildErrorResponseData = (err, opts = {}) => {
  if (Array.isArray(err)) {
    /* eslint no-use-before-define: 0 */
    return serializeArrayOfErrors(err, opts);
  }

  const data = Object.create(null);
  fillStatusCode(err, data);

  fillRequestErrorData(err, data);

  return data;
};

const serializeArrayOfErrors = (errors, options) => {
  const details = errors.map(e => buildErrorResponseData(e, options));
  return {
    statusCode: 500,
    details,
  };
};

module.exports = {
  fillStatusCode,
  buildErrorResponseData,
  serializeArrayOfErrors,
  fillRequestErrorData,
};
