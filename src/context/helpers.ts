import { Context } from '@loopback/context';
import cookie from 'cookie';
import debugFactory from 'debug';
import setCookie from 'set-cookie-parser';
import { CONTEXT_PREFIX } from '../utils';

const debug = debugFactory('compositjs:context:utils');

/**
 * `setHeadersToContext` is utility function to set header information
 * to given context binding with given prefix.
 *
 * @param {object} headers
 * @param {object} ctx Context
 * @param {string} svcKeyPre Service key prefix
 */
export function bindHeadersToContext(headers: any, ctx: Context, svcKeyPre: any) {
  // Setting up headers to context
  Object.keys(headers).forEach(key => {
    if (key === 'cookie') return; // Not setting cookie with his loop
    ctx.bind(`${svcKeyPre}.headers.${key}`).to(headers[key]).tag(svcKeyPre);
  });

  // Setting up cookies to context
  const cookies = headers && headers.cookie ? cookie.parse(headers.cookie) : (headers['set-cookie'] ? setCookie(headers['set-cookie'], { map: true }) : {});
  Object.keys(cookies).forEach(key => ctx.bind(`${svcKeyPre}.cookie.${key}`).to(cookies[key]));
}

/**
 * This function returns resolved paramters which defined in service configuration.
 *
 * @example Accessing parameter value from context object
 * ...,
 * ...,
 * "<parameter name>": {
 *    "value": "$.<context path goes here>",
 *    "required": true
 * },
 * ...
 *
 * @example Declaring parameter value as default value
 * ...,
 * ...,
 * "<parameter name>": {
 *    "value": "<constant value goes here>",
 *    "required": true
 * },
 * ...
 *
 * @param {object} params
 * @param {object} context
 */
export function getParamsFromContext(params: any, context: Context) {
  const result: any = {};

  if (!params) return result;

  // If params type is a string and which is able to accessing directly from context
  if (params && typeof params === 'string' && params.substring(0, 2) === CONTEXT_PREFIX) {
    return context.getSync(params.replace(CONTEXT_PREFIX, ''));
  }

  Object.keys(params).forEach((paramkey: any) => {
    const parameter: any = params[paramkey];
    try {
      const value = parameter.value || parameter;
      if (typeof value !== 'string') {
        throw new Error(`${paramkey} parameter not defined properly.`);
      }

      // If value accessing from context variable then start with `$.`
      if (value && value.substring(0, 2) === CONTEXT_PREFIX) {
        result[`${paramkey}`] = context.getSync(value.replace(CONTEXT_PREFIX, ''));
      } else {
        result[`${paramkey}`] = value;
      }
    } catch (e) {
      debug('getParamsFromContext:', e.message);
      result[`${paramkey}`] = parameter.default || '';
    }

    if (!result[`${paramkey}`] && parameter.required) {
      throw new Error(`Parameter "${paramkey}" not found.`);
    }
  });

  return result;
}
