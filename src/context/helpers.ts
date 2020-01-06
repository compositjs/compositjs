import { Context } from '@loopback/context';
import cookie from 'cookie';
import debugFactory from 'debug';
import { get } from 'lodash';
import setCookie from 'set-cookie-parser';
import { CONTEXT_PREFIX } from '../utils';

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
export function bindHeadersToContext(headers: any, ctx: Context, svcKeyPrefix: any) {
  // Setting up headers to context
  Object.keys(headers).forEach((key) => {
    if (key === 'cookie') return; // Not setting cookie with his loop
    ctx.bind(`${svcKeyPrefix}.headers.${key}`).to(headers[key]).tag(svcKeyPrefix);
  });

  // Setting up cookies to context
  const cookies = parseCookie(headers);
  Object.keys(cookies).forEach((key) => ctx.bind(`${svcKeyPrefix}.cookie.${key}`).to(cookies[key]));
}

function extractKeyFromContext(key: string, context: Context) {
  const bindKey = key.replace(CONTEXT_PREFIX, '');
  // If value retriving from body content
  if (bindKey.indexOf(".body.") > 0) {
    const bodyBindKey = bindKey.split(".body.");
    const body = context.getSync(bodyBindKey[0] + ".body");
    return get(body, bodyBindKey[1], '');
  }

  return context.getSync(bindKey);
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
  if (params && typeof params === 'string') {
    if (params.substring(0, 2) === CONTEXT_PREFIX) {
      return extractKeyFromContext(params, context);
    } else {
      return params;
    }
  }

  Object.keys(params).forEach((paramkey: any) => {
    const parameter: any = params[paramkey];
    try {
      let value = parameter.value || parameter;
      if (typeof value !== 'string') {
        throw new Error(`${paramkey} parameter not defined properly.`);
      }

      // If value accessing from context variable then start with `$.`
      if (value && value.substring(0, 2) === CONTEXT_PREFIX) {
        result[`${paramkey}`] = extractKeyFromContext(value, context);
      } else {
        const matches = value.match(/{{([^}]+)}}/g);
        if (matches) {
          matches.map((key) => value = value.replace(key, extractKeyFromContext(key.replace(/{{|}}/g, '').trim(), context)));
        }

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
