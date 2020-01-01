
export function fillStatusCode(err: any, data: any) {
  let statusCode = err.statusCode || err.status;
  if (!statusCode || statusCode < 400) {
    statusCode = 500;
  }
  return {
    ...data,
    statusCode,
  };
}

export function fillRequestErrorData(err: any, data: any) {
  return {
    ...data,
    name: err.name,
    message: err.message,
    code: err.code,
    details: err.details,
  };
}

export function buildErrorResponseData(err: any) {
  let data = Object.create(null);
  data = fillStatusCode(err, data);
  data = fillRequestErrorData(err, data);

  return data;
}

export function serializeArrayOfErrors(errors: any) {
  const details = errors.map((e: any) => buildErrorResponseData(e));
  return {
    statusCode: 500,
    details,
  };
}


export function returnErrorResponse(error: any) {
  let data = null;
  if (Array.isArray(error)) {
    data = serializeArrayOfErrors(error);
  } else {
    data = buildErrorResponseData(error);
  }

  return {
    body: data,
    status: data.statusCode,
  };
}
