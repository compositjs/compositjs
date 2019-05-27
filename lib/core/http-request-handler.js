

const { Context } = require('@loopback/context');
const async = require('async');
const RoutingTable = require('../routes/routing-table');
const { bindHeadersToContext, RequestContext } = require('../context');

const buildResponse = async (route, context) => {
  if (!route.output) {
    throw new Error('Output not defined in route');
  }

  const response = {
    body: {},
    status: 200,
  };

  if (route.output.strategy === 'composit') {
    Object.values(route.output.services).forEach((service) => {
      response.body[service] = context.getSync(`service.${service}.body`);
    });
  }

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

      if (route == null) {
        response.body = '';
        response.status = 404;
        return;
      }

      await this.processRoute(route, requestContext);

      const routeResponse = await buildResponse(route, requestContext);

      response.body = routeResponse.body;
      response.status = routeResponse.status;
    } else {
      response.body = '';
      response.status = 404;
    }
  }

  async processRoute(route, context) {
    return new Promise(async (resolve) => {
      try {
        async.eachSeries(route.serviceGroups, async (serviceGroup) => {
          await Promise
            .all(serviceGroup.services.map(service => this.processService(service, context)))
            .then((serviceResponses) => {
              // Mounting service responses to context
              serviceResponses.every((service) => {
                const serviceKeyPrefix = `service.${service.key}`;
                const serviceResponse = service.data;
                context.bind(`${serviceKeyPrefix}.body`).to(serviceResponse.body);
                context.bind(`${serviceKeyPrefix}.status`).to(serviceResponse.statusCode || serviceResponse.status || serviceResponse.body.statusCode);

                bindHeadersToContext(serviceResponse.headers || {}, context, serviceKeyPrefix);
                return true;
              });
            }).catch((err) => {
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

        const serviceKey = `${serviceConfig.serviceName || serviceConfig.id}`;

        // Retriving service by id or serviceName
        const service = self.getSync(`service.${serviceKey}`);

        // Executing service
        const serviceResponse = await service.execute(context);

        console.log(`Processing ${serviceConfig.id} finised.`);

        resolve({ key: serviceConfig.id, data: serviceResponse });
      } catch (err) {
        console.log(err);
      }
    });
  }
}

module.exports = HTTPRequestHandler;
