"use strict";

const cookie = require('cookie');

/**
 * `setHeadersToContext` is utility function to set header information 
 * to given context binding with given prefix.
 * 
 * @param {object} headers 
 * @param {object} context 
 * @param {string} serviceKeyPrefix 
 */
module.exports.bindHeadersToContext = (headers, context, serviceKeyPrefix) => {

  // Setting up headers to context
  for (var key in headers) {
    if(key === 'cookie') continue; // Not setting cookie with his loop
    context.bind(`${serviceKeyPrefix}.headers.${key}`).to(headers[key]);
  }
    

  // Setting up cookies to context
  const cookies = headers && headers.cookie ? cookie.parse(headers.cookie) : {};
  for (var key in cookies) 
    context.bind(`${serviceKeyPrefix}.cookie.${key}`).to(cookies[key]);
};