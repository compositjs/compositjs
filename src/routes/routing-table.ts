
import debugFactory from 'debug';
import * as _ from 'lodash';
import { IRequestContext } from '../utils';
import openAPIParameterResolver from './openapi';
import { validateAndFormatPath } from './utils/path';

const debug = debugFactory('compositjs:routing-table');

/**
 * Returns array of parameters from path
 *
 * @param {Array} routeKeys Path segments configured in OpenAPI
 * @param {*} routeMatch Regex matched items
 *
 * @returns Path parameters
 */
const getPathParams = (routeKeys: any, routeMatch: any) => {
  const pathParams: any = {};
  Object.values(routeKeys).forEach((key: any, ix: number) => {
    const matchIndex = +ix + 1;
    pathParams[key.name] = routeMatch[matchIndex];
  });
  return pathParams;
};

/**
 * Routing table is a registry for route definitons
 * and its responsible for identifying(find) routes when request comes.
 */
export default class RoutingTable {
  _routes: any = [];

  find(requestContext: IRequestContext) {
    let matchedRoute = null;
    const reqPath = requestContext.getSync('request.path');
    const reqMethod = requestContext.getSync('request.method');
    const query = requestContext.getSync('request.query');

    Object.values(this._routes).some((route: any) => {
      debug('find: route:', route.info.name);

      // Validating method e.g. GET, POST etc
      if (route.method.toLowerCase() !== reqMethod) {
        debug('find: method-validation:', false);
        return false;
      }

      // Validating route path
      const match = route.regexp.exec(reqPath);
      if (!match) {
        debug('find: path-validation:', match);
        return false;
      }

      // Retrive path parameters for the selected route.
      const parameters = {};
      const params = getPathParams(route.keys, match);
      Object.assign(parameters, { query, params });

      const error = openAPIParameterResolver(route.parameters, parameters);

      if (!error) {
        debug('find: open-api-params-resolver:', error);
        return false;
      }

      // Above all conditions true, then get path params, if any.
      matchedRoute = Object.assign(route, { pathParams: params });

      if (matchedRoute) {
        return true;
      }

      return false;
    });

    debug('find: matched-route:', matchedRoute);

    return matchedRoute;
  }

  register(route: any) {
    const routeFormat = validateAndFormatPath(route.definition.path);

    // Generate service groups
    const serviceGroups = this.createServicesToGroups(route);

    const routeData = Object.assign(routeFormat, {
      info: route.info,
      method: route.definition.method,
      parameters: route.definition.parameters,
      output: route.output,
      serviceGroups,
    });

    this._routes.push(routeData);
  }

  /**
   * Converting multi-level services to array of service groups.
   *
   * First level services to first array group
   * Second level services to second group and so on...
   *
   * @param {object} route route definition object
   *
   */
  createServicesToGroups(route: any, serviceGroups: any = [], index: number = 0) {
    if (route && route.services) {
      if (!serviceGroups[index] || !serviceGroups[index].services) {
        serviceGroups[index] = {
          services: [],
        };
      }

      route.services.map((service: any) => {
        serviceGroups[index].services.push({ ..._.omit(service, ['services']) });
        return this.createServicesToGroups(service, serviceGroups, index + 1);
      });
    }

    return serviceGroups;
  }
}
