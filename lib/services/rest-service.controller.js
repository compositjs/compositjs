

const get = require('lodash/get');
const debug = require('debug')('compositjs:service:rest-service');
const pathToRegExp = require('path-to-regexp');
const cookie = require('cookie');
const Confidence = require('confidence');
const { serviceNotAvaliable, returnErrorResponse, serviceTimedOut } = require('../error-handler');
const getServiceBreaker = require('./hystrix');


const CONTEXT_PREFIX = '$.';

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
const getParamsFromContext = (params, context) => {
  const result = {};

  if (!params) return result;

  Object.keys(params).map((paramkey) => {
    const param = params[paramkey];
    try {
      const value = param.value || param;

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
      result[`${paramkey}`] = param.default || '';
    }

    if (!result[`${paramkey}`] && param.required) {
      throw new Error(`Parameter "${paramkey}" not found.`);
    }
  });

  return result;
};


/**
 * Resolve and build service path with path & query parameters
 *
 * @param {object} spec Service JSON specification
 * @param {object} context Request context
 *
 * @returns Rest Service path
 */
const resolveServicePath = (spec, context) => {
  let queryparams = {};
  let pathparams = {};

  // Find path parameters
  if (spec.parameters && spec.parameters.path) {
    pathparams = getParamsFromContext(spec.parameters.path, context);
  }

  // Find query parameters
  if (spec.parameters && spec.parameters.query) {
    queryparams = getParamsFromContext(spec.parameters.query, context);
  }

  // Removing empty values from pathparams
  Object.keys(pathparams).forEach(key => (pathparams[key] === '') && delete pathparams[key]);
  const path = pathToRegExp.compile(spec.path)(pathparams);

  // Resolving query parameters
  const queryparts = Object.keys(queryparams).map((key) => {
    let value = '';
    if (queryparams[key] === 'undefined' || queryparams[key] === 'undefined') {
      value = get(spec, `parameters.query[${key.name}].default`, '');
    } else if (typeof queryparams[key] === 'object') {
      value = JSON.stringify(queryparams[key]);
    }
    return `${key}=${value}`;
  });

  const servicePath = `${path}${queryparts && queryparts.length > 0 ? `?${queryparts.join('&')}` : ''}`;
  debug('service-path after resolve:', `${servicePath}`);

  return servicePath;
};

/**
 * Creating rest service URL
 *
 * @param {object} spec Service JSON specification
 * @param {object} context context
 * @returns Rest Service URL
 */
const resolveServiceURL = (spec, context) => {
  const { host } = spec;
  const path = resolveServicePath(spec, context);

  debug('service-url after resolve:', `${host}${path}`);

  return `${host}${path}`;
};

class RestserviceController {
  constructor(spec = {}) {
    this.spec = new Confidence.Store(spec).get('/');
    this._service = getServiceBreaker(spec);
  }

  /**
   * Building request options from JSON configuration file
   */
  _resolveRequestConfigurations(context) {
    const { service } = this.spec;

    const headerparams = getParamsFromContext(service.headers, context);
    const isJSON = !!(headerparams['content-type'] && headerparams['content-type'].indexOf('json') > -1);

    const config = {
      options: {
        json: isJSON,
        method: service.method,
        headers: headerparams,
      },
    };

    config.options.timeout = service.timeout || process.env.DEFAULT_SERVICE_TIMEOUT;

    // Setting cookies
    const cookieparams = getParamsFromContext(service.cookies, context);

    const cookies = Object.keys(cookieparams).map(cookieName => cookie.serialize(cookieName, cookieparams[cookieName]));

    if (cookies.length > 0) {
      config.options.headers.cookie = cookies.join(';');
    }

    // If URL is not defined the then resolve from host and path
    if (!service.url) {
      if (!service.host || !service.path) {
        throw new Error('Service sepecification host and path is required, if URL is not define.');
      }

      config.url = resolveServiceURL(service, context);
    }

    debug('Request config:', config);

    return config;
  }

  // Execute for RestService
  async invoke(context) {
    const reqConfigs = this._resolveRequestConfigurations(context);
    let response = {};

    try {
      // Executing service through hystrix
      response = await this._service.execute(reqConfigs.url, reqConfigs.options);
    } catch (err) {
      let error = {};

      // For the 'rest' service execution, Hystrix will return error if circute breaker is opended
      if (err.message === 'OpenCircuitError' || err.code === 'ECONNREFUSED') {
        error = serviceNotAvaliable(err, this.spec);
      }

      // For the 'rest' service execution, Hystrix will return error if circute breaker is opended
      if (err.message === 'CommandTimeOut') {
        error = serviceTimedOut(err, this.spec);
      }

      // Assigning refactored error to response
      response = returnErrorResponse(error, {});

      if (this.spec.service.fallback) {
        debug(`fallback for service(${this.spec.info.name})`, response);

        // TODO: setup logging
        console.log(`fallback for service(${this.spec.info.name})`, response.body.message);

        // Setting fallback data as response body
        response.body = this.spec.service.fallback;

        // TODO: should control through flag(ENV or global setting) to
        // change the status code of fallback(ed) responses.
        response.status = 200;
      }
    }

    return response;
  }
}

module.exports = RestserviceController;
