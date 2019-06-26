
export function fillStatusCode(err: any, data: any) {
  data.statusCode = err.statusCode || err.status;
  if (!data.statusCode || data.statusCode < 400) { data.statusCode = 500; }
};

export function fillRequestErrorData(err: any, data: any) {
  data.name = err.name;
  data.message = err.message;
  data.code = err.code;
  data.details = err.details;
};

export function buildErrorResponseData(err: any, opts: any = {}) {
  if (Array.isArray(err)) {
    return serializeArrayOfErrors(err, opts);
  }

  const data = Object.create(null);
  fillStatusCode(err, data);

  fillRequestErrorData(err, data);

  return data;
};

export function serializeArrayOfErrors(errors: any, options: any) {
  const details = errors.map((e: any) => buildErrorResponseData(e, options));
  return {
    statusCode: 500,
    details,
  };
};

export function returnErrorResponse(error: any, opts: any = {}) {
  const options: any = opts || {};

  const data = buildErrorResponseData(error, options);

  return {
    body: data,
    status: data.statusCode,
  };
};
