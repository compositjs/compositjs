
const { Context } = require('@loopback/context');
const async = require('async');
const cookie = require('cookie');
const RoutingTable = require('../routes/routing-table');
const { bindHeadersToContext, RequestContext, getParamsFromContext } = require('../context');


const buildResponse = async (route, context, response) => {

  if (!route.output) {
    throw new Error('Output not defined in route');
  }

  const headerparams = getParamsFromContext(route.output.headers, context);
  Object.keys(headerparams).map(headerparam => response.set(headerparam, headerparams[headerparam]));

  const newCookies = [];
  const cookieparams = getParamsFromContext(route.output.cookies, context);
  Object.keys(cookieparams).map(cookiename => newCookies.push(cookie.serialize(cookiename, cookieparams[cookiename].value, cookieparams[cookiename])));

  if (newCookies.length > 0) {
    response.set('set-cookie', [...newCookies]);
  }

  // Combining all services output as JSON object
  if (route.output.strategy === 'composit') {
    const compositBody = {};
    const s = [];
    context.findByTag(new RegExp(/^service\.(.+)/)).map((binding) => s.push(...binding.tagNames));
    
    // If no services mentioned take all services
    if(!route.output.services) { 
      // console.log(context.findByTag(new RegExp(/^service\.(.+)/)));

      outputServices = [...new Set(s)].map(serviceKey => serviceKey.replace('service.', ''))
      
    } else {
      outputServices = route.output.services;
    }
    
    Object.values(outputServices).forEach((service) => {
      compositBody[service] = context.getSync(`service.${service}.body`);
    });

    response.body = compositBody;

  // Straight forward output from given service
  } else if (route.output.strategy === 'standard') {

    response.body = context.getSync(`service.${route.output.service}.body`);
  }

  response.status = route.output.status ? +getParamsFromContext(route.output.status, context) : 200;

  return response;
};

/**
 *
 * @param {*} server
 */
class HTTPRequestHandler extends Context {
  /**
   * Request handler
   *
   * - intialize server content
   *
   * @param rootContext
   */
  constructor(rootContext) {
    super(rootContext);

    this.routingTable = new RoutingTable();

    Object.values(this.find('route.*')).forEach(specs => this.routingTable.register(specs.getValue()));
  }

  async handleRequest(request, response) {
    const requestContext = new RequestContext(request, response);

    const route = this.routingTable.find(requestContext);

    if (route) {

      // Binding path parameters with current request context
      Object.keys(route.pathParams).forEach(key => requestContext.bind(`request.path.${key}`).to(route.pathParams[key]));

      await this.processRoute(route, requestContext);

      await buildResponse(route, requestContext, response);

    } else {
      response.body = '';
      response.status = 404;
    }
  }

  async processRoute(route, context) {
    return new Promise(async (resolve) => {
      try {
        async.eachSeries(route.serviceGroups, async (serviceGroup) => {
          await Promise.all(serviceGroup.services.map(service => this.processService(service, context)))
            .catch((err) => {
              console.log(err);
            });
        }, resolve);
      } catch (err) {
        console.log(err);
      }
    });
  }

  async processService(serviceConfig, context) {
    const self = this;

    return new Promise(async (resolve) => {
      try {
        console.log(`Processing ${serviceConfig.id} started.`);

        // Retriving service by id or serviceName
        const service = self.getSync(`service.${serviceConfig.serviceName || serviceConfig.id}`);

        // Executing service
        const serviceResponse = await service.execute(context);

        console.log(`Processing ${serviceConfig.id} finised.`);

        const serviceKeyPrefix = `service.${serviceConfig.id}`;
        context.bind(`${serviceKeyPrefix}.body`).to(serviceResponse.body || '');
        context.bind(`${serviceKeyPrefix}.status`).to(serviceResponse.statusCode || serviceResponse.status || serviceResponse.body.statusCode);

        bindHeadersToContext(serviceResponse.headers || {}, context, serviceKeyPrefix);

        resolve();

      } catch (err) {
        console.log(err);
      }
    });
  }
}

module.exports = HTTPRequestHandler;
