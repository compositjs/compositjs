import { config } from '@loopback/context';
import cookie from 'cookie';
import debugFactory from 'debug';
import { getParamsFromContext } from '../../context';
import { returnErrorResponse, serviceNotAvaliable, serviceTimedOut } from '../../error-handler';
import { IRequestContext, IService, IServiceRequestConfig } from '../../utils';
import { mergeServiceSpecWithRouteServiceSpec, resolveServiceURL } from './helpers';
import { getServiceBreaker } from './hystrix';
const debug = debugFactory('compositjs:service:rest-service');

/**
 * Building request options from JSON configuration file
 */
const resolveRequestConfigurations = (spec: any, context: IRequestContext) => {
  const { service } = spec;
  const serviceRequest: IServiceRequestConfig = service.request;

  const headers = getParamsFromContext(serviceRequest.headers, context);

  const config: any = {
    options: {
      method: serviceRequest.method,
      headers,
      followRedirect: false,
    },
  };

  if (['GET', 'HEAD'].includes(serviceRequest.method)) {
    config.options.json = !!(headers['content-type'] && headers['content-type'].indexOf('json') > -1);
  }

  config.options.timeout = serviceRequest.timeout || process.env.DEFAULT_SERVICE_TIMEOUT;

  // Setting cookies
  const cookieparams = getParamsFromContext(serviceRequest.cookies, context);

  const cookies = Object.keys(cookieparams).map(item => cookie.serialize(item, cookieparams[item]));

  if (cookies.length > 0) {
    config.options.headers.cookie = cookies.join(';');
  }

  // If URL is not defined the then resolve from host and path
  if (!serviceRequest.url) {
    if (!serviceRequest.host || !serviceRequest.path) {
      throw new Error('Service sepecification host and path is required, if URL is not define.');
    }

    const { host, path } = resolveServiceURL(serviceRequest, context);
    config.options.path = path;
    config.options.host = host;
    config.url = `${host}${path}`;
  }

  debug('Request config:', config);

  return config;
}

export default class RestService implements IService {

  _service: any;
  _clients: any;

  constructor(@config() public _spec: any = {}) {
    this._service = getServiceBreaker(this._spec);
  }

  // Execute for RestService
  async execute(context: IRequestContext, routeServiceSpec?: any) {
    const spec = mergeServiceSpecWithRouteServiceSpec(this._spec, routeServiceSpec)

    let response: any = {};

    try {
      const reqConfig = resolveRequestConfigurations(spec, context);
      // Executing service through hystrix
      response = await this._service.execute(reqConfig.options);
    } catch (err) {
      let error = {};

      // For the 'rest' service execution, Hystrix will return error if circute breaker is opended
      if (err.message === 'OpenCircuitError' || err.code === 'ECONNREFUSED') {
        error = serviceNotAvaliable(err, spec);
      }

      // For the 'rest' service execution, Hystrix will return error if circute breaker is opended
      if (err.message === 'CommandTimeOut') {
        error = serviceTimedOut(err, spec);
      }

      // Assigning refactored error to response
      response = returnErrorResponse(error);

      if (spec.service.fallback) {
        debug(`fallback for service(${spec.info.name})`, response);

        // TODO: setup logging
        console.log(`fallback for service(${spec.info.name})`, response.body.message);

        // Setting fallback data as response body
        response.body = spec.service.fallback;

        // TODO: should control through flag(ENV or global setting) to
        // change the status code of fallback(ed) responses.
        response.status = 200;
      }
    }

    return response;
  }
}
