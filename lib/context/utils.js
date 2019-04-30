

const cookie = require('cookie');

/**
 * `setHeadersToContext` is utility function to set header information
 * to given context binding with given prefix.
 *
 * @param {object} headers
 * @param {object} ctx Context
 * @param {string} svcKeyPre Service key prefix
 */
module.exports.bindHeadersToContext = (headers, ctx, svcKeyPre) => {
  // Setting up headers to context
  Object.keys(headers).forEach((key) => {
    if (key === 'cookie') return; // Not setting cookie with his loop
    ctx.bind(`${svcKeyPre}.headers.${key}`).to(headers[key]);
  });


  // Setting up cookies to context
  const cookies = headers && headers.cookie ? cookie.parse(headers.cookie) : {};
  Object.keys(cookies).forEach(key => ctx.bind(`${svcKeyPre}.cookie.${key}`).to(cookies[key]));
};
