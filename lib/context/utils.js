

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

/* eslint no-nested-ternary: 0 */
/* eslint no-param-reassign: 0 */
/* eslint no-plusplus: 0 */
/* eslint no-cond-assign: 0 */
/* eslint no-sequences: 0 */
/* eslint consistent-return: 0 */
const decorate = function (decorators, target, key, desc) {
  const c = arguments.length;
  let r = c < 3
    ? target : desc === null
      ? desc = Object.getOwnPropertyDescriptor(target, key) : desc;
  let d;
  if (typeof Reflect === 'object' && typeof Reflect.decorate === 'function') {
    r = Reflect.decorate(decorators, target, key, desc);
  } else {
    for (let i = decorators.length - 1; i >= 0; i--) {
      if (d = decorators[i]) {
        r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
      }
    }
  }
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};

const metadata = function (k, v) {
  if (typeof Reflect === 'object' && typeof Reflect.metadata === 'function') return Reflect.metadata(k, v);
};

const param = function (paramIndex, decorator) {
  return function (target, key) { decorator(target, key, paramIndex); };
};

exports.decorate = decorate;
exports.metadata = metadata;
exports.param = param;
