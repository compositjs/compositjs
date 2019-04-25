"use strict";

const { buildErrorResponseData } = require('./data-builder');

module.exports.returnErrorResponse = (error, opts = {}) => {

  let options = opts || {};

  const data = buildErrorResponseData(error, options);
  
  return {
    body: data,
    status: data.statusCode
  }
};