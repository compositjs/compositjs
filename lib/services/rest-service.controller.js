

const get = require('lodash/get');
const debug = require('debug')('compositjs:service:rest-service');
const pathToRegExp = require('path-to-regexp');
const cookie = require('cookie');
const Confidence = require('confidence');
const { serviceNotAvaliable, returnErrorResponse, serviceTimedOut } = require('../error-handler');
const getServiceBreaker = require('./hystrix');
const { getParamsFromContext } = require('../context');


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
    if (queryparams[key] === 'undefined') {
      value = get(spec, `parameters.query[${key.name}].default`, '');
    } else if (typeof queryparams[key] === 'object') {
      value = JSON.stringify(queryparams[key]);
    } else {
      value = queryparams[key];
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
        followRedirect: false,
      },
    };

    config.options.timeout = service.timeout || process.env.DEFAULT_SERVICE_TIMEOUT;

    // Setting cookies
    const cookieparams = getParamsFromContext(service.cookies, context);

    const cookies = Object.keys(cookieparams).map(item => cookie.serialize(item, cookieparams[item]));

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
