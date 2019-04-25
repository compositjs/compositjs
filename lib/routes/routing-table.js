"use strict";

let _ = require('lodash');
const path = require('./utils/path');
const {openAPIParameterResolver} = require('./openapi');
const debug = require('debug')('service-composer:routing-table');

/**
 * Returns array of parameters from path
 * 
 * @param {Array} routeKeys Path segments configured in OpenAPI
 * @param {*} routeMatch Regex matched items
 * 
 * @returns Path parameters
 */
const getPathParams = (routeKeys, routeMatch) => {
  const pathParams = {};
  for (const ix in routeKeys) {
    const key = routeKeys[ix];
    const matchIndex = +ix + 1;
    pathParams[key.name] = routeMatch[matchIndex];
  }
  return pathParams;
}

/**
 * Routing table is a registry for route definitons 
 * and its responsible for identifying(find) routes when request comes.
 * 
 */
class RoutingTable {

  constructor() {
    this._routes = [];
  }

  find(request) {

    let matchedRoute = null;
    const path = request.ctx.getSync('request.path');
    const method = request.ctx.getSync('request.method');
    
    for(const route of this._routes) {

      debug("find: route:", route.info.name)

      // Validating method e.g. GET, POST etc
      if(route.method.toLowerCase() !== method) {
        debug("find: method-validation:", false);
        continue;
      }

      // Validating route path
      const match = route.regexp.exec(path);
      if(!match) {
        debug("find: path-validation:", match);
        continue;
      }

      // Retrive path parameters for the selected route.
      const pathParams =  getPathParams(route.keys, match);

      const error = openAPIParameterResolver(route.parameters, Object.assign(request, { params: pathParams }));

      if(!error) {
        debug("find: open-api-params-resolver:", error);
        continue;
      } 

      // Above all conditions true, then get path params, if any.
      matchedRoute = Object.assign(route, {pathParams});

      if(matchedRoute) 
        break;
    }

    debug("find: matched-route:", matchedRoute);

    return matchedRoute;
  }

  register(route) {

    const routeFormat = path.validateAndFormatPath(route.definition.path);

    // Generate service groups
    const serviceGroups = this.convertServicesToGroups(route);
    
    const routeData = Object.assign(routeFormat, {
      info: route.info,
      method: route.definition.method,
      parameters: route.definition.parameters,
      output: route.output,
      serviceGroups: serviceGroups
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
  convertServicesToGroups(route, serviceGroups = [], index = 0) {
    
    if(route && route.services) {

      if(!serviceGroups[index] || !serviceGroups[index].services) {
        serviceGroups[index] = {
          services: []
        };
      }
      
      route.services.map((service) => {
        serviceGroups[index].services.push(Object.assign({}, _.omit(service, ['services'])));
        this.convertServicesToGroups(service, serviceGroups, index + 1);
      });
    }

    return serviceGroups;
  }
}

module.exports = RoutingTable;