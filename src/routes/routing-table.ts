
import debugFactory from 'debug';
import { omit } from 'lodash';
import NodeCache from 'node-cache';
import { IRequestContext, RequestBindings } from '../utils';
import { convertPathToRegexp } from './utils/path';
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
  _cache: any = new NodeCache();

  find(requestContext: IRequestContext) {
    const requestParams: any = requestContext.getSync(RequestBindings.REQUEST_PARAMS)
    const reqPath = requestParams.params.path;
    const reqMethod = requestParams.params.method;
    // const query = requestParams.params.query;
    const key = `${reqMethod}-${reqPath}`

    let matchedRoute = this._cache.get(key) || null
    if (!matchedRoute) {
      this._routes.some((route: any) => {
        debug('find: route:', route.info.name);

        // Validating method e.g. GET, POST etc
        const routeMethods = route.method.split('|').map((method: string) => method.toLowerCase())
        if (!routeMethods.includes(reqMethod)) {
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
        const params = getPathParams(route.keys, match);

        /** DISABLING FOR TIME BEING, DUE TO PERFORMANCE ISSUE */
        // const error = openAPIParameterResolver(route.parameters, {
        //   query,
        //   params,
        // });

        // if (!error) {
        //   debug('find: open-api-params-resolver:', error);
        //   return false;
        // }

        // Above all conditions true, then get path params, if any.
        matchedRoute = Object.assign(route, { pathParams: params });
        this._cache.set(key, matchedRoute)

        return true;
      });
    }
    debug('find: matched-route:', matchedRoute);

    return matchedRoute;
  }

  register(route: any) {
    const routeFormat = convertPathToRegexp(route.definition.path);

    // Generate service groups
    const serviceGroups = this.createServicesToGroups(route);

    const routeData = Object.assign(routeFormat, {
      info: route.info,
      method: route.definition.method,
      parameters: route.definition.parameters,
      output: route.output,
      serviceGroups,
      services: route.services
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
        serviceGroups[index].services.push({ ...omit(service, ['services']) });
        return this.createServicesToGroups(service, serviceGroups, index + 1);
      });
    }

    return serviceGroups;
  }
}
