import cookie from 'cookie';
import debugFactory from 'debug';
import { get } from 'lodash';
import setCookie from 'set-cookie-parser';
import { CONTEXT_PREFIX, IRequestContext } from '../utils';

const debug = debugFactory('compositjs:context:utils');

const parseCookie = (headers: any) => {
  if (headers && headers.cookie) {
    return cookie.parse(headers.cookie);
  } if (headers['set-cookie']) {
    return setCookie(headers['set-cookie'], { map: true });
  }
  return {};
};

/**
 * `setHeadersToContext` is utility function to set header information
 * to given context binding with given prefix.
 *
 * @param {object} headers
 * @param {object} ctx Context
 * @param {string} svcKeyPre Service key prefix
 */
export function extractHeadersAndCookies(headers: any): any {
  // Setting up headers to context
  const h: any = {}
  for (const key in headers) {
    if (key === 'cookie') {
      continue;
    }
    h[key] = headers[key]
  }

  // Setting up cookies to context
  const cookies = parseCookie(headers);
  const c: any = {}
  for (const key in cookies) {
    c[key] = cookies[key]
  }

  return { cookies: c, headers: h }
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
export function getParamsFromContext(params: any, context: IRequestContext) {
  const result: any = {};

  if (!params) return result;

  // If params type is a string and which is able to accessing directly from context
  if (params && typeof params === 'string') {
    if (params.substring(0, 2) === CONTEXT_PREFIX) {
      const paramKeys: string[] = params.split('.')
      const contextValue = context.getSync(paramKeys[1]);
      return get(contextValue, paramKeys.splice(2, paramKeys.length).join('.'), '');
    } else {
      return params;
    }
  }

  for (const paramkey in params) {
    const parameter: any = params[paramkey];
    try {
      const value: string = parameter.value || parameter;
      if (typeof value !== 'string') {
        throw new Error(`${paramkey} parameter not defined properly.`);
      }

      // If value accessing from context variable then start with `$.`
      if (value && value.substring(0, 2) === CONTEXT_PREFIX) {
        const paramKeys: string[] = value.split('.')
        const contextValue = context.getSync(paramKeys[1]);
        const valKey = paramKeys.splice(2, paramKeys.length).join('.')
        result[`${paramkey}`] = get(contextValue, valKey, '')
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
  }

  return result;
}
