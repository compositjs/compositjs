import debugFactory from 'debug';
import { get } from 'lodash';
import { compile } from 'path-to-regexp';
import { getParamsFromContext } from '../../context';
import { IRequestContext, IServiceRequestConfig } from "../../utils";
const debug = debugFactory('compositjs:service:rest-service');
/**
 * Resolve and build service path with path & query parameters
 *
 * @param {object} spec Service JSON specification
 * @param {object} context Request context
 *
 * @returns Rest Service path
 */
const resolveServicePath = (spec: IServiceRequestConfig, context: IRequestContext) => {
  let queryparams: any = {};
  let pathparams: any = {};

  // Find path parameters
  pathparams = getParamsFromContext(spec.parameters?.path, context);

  // Find query parameters
  queryparams = getParamsFromContext(spec.parameters?.query, context);

  // Removing empty values from pathparams
  Object.keys(pathparams).forEach((key: any) => (pathparams[key] === '') && delete pathparams[key]);
  const path = compile(spec.path)(pathparams);

  // Resolving query parameters
  const queryparts = Object.keys(queryparams).map((key: any) => {
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

  // Joining URL, Path with path parameters and query parameters
  const servicePath = `${path}${queryparts && queryparts.length > 0 ? `?${encodeURI(queryparts.join('&'))}` : ''}`;
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
export const resolveServiceURL = (spec: IServiceRequestConfig, context: IRequestContext) => {
  const { host } = spec;
  const path = resolveServicePath(spec, context);

  debug('service-url after resolve:', `${host}${path}`);

  return { host, path };
};


export const mergeServiceSpecWithRouteServiceSpec = (serviceSpec: any, routeServiceSpec: any,) => {
  if (routeServiceSpec?.request?.parameters?.query) {
    serviceSpec.service.request.parameters.query = {
      ...serviceSpec.service.request.parameters.query,
      ...routeServiceSpec.request.parameters.query
    };
  }

  if (routeServiceSpec?.request?.parameters?.path) {
    serviceSpec.service.request.parameters.path = {
      ...serviceSpec.service.request.parameters.path,
      ...routeServiceSpec.request.parameters.path
    };
  }

  if (routeServiceSpec?.request?.headers) {
    serviceSpec.service.request.headers = {
      ...serviceSpec.service.request.headers,
      ...routeServiceSpec.request.headers
    };
  }

  if (routeServiceSpec?.request?.cookies) {
    serviceSpec.service.request.cookies = {
      ...serviceSpec.service.request.cookies,
      ...routeServiceSpec.request.cookies
    };
  }

  return serviceSpec;
}
