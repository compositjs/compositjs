

const { Context } = require('@loopback/context');
const async = require('async');
const RoutingTable = require('../routes/routing-table');
const { bindHeadersToContext, RequestContext } = require('../context');

class RequestHandler extends Context {
  constructor(server) {
    super(server);

    this.routingTable = new RoutingTable();

    Object.values(this.find('route.*')).forEach(specs => this.routingTable.register(specs.getValue()));
  }

  async handleRequest(request, response) {
    request.ctx = new RequestContext(request, response);

    const route = this.routingTable.find(request);

    if (route) {
      // Binding path parameters with current request context
      Object.keys(route.pathParams).forEach(key => request.ctx.bind(`request.path.${key}`).to(route.pathParams[key]));

      if (route == null) {
        response.body = '';
        response.status = 404;
        return;
      }

      await this.process(route, request.ctx);

      const routeResponse = await this.buildResponse(route, request.ctx);

      response.body = routeResponse.body;
      response.status = routeResponse.status;
    } else {
      response.body = '';
      response.status = 404;
    }
  }

  static async buildResponse(route, context) {
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
  }


  async process(route, context) {
    return new Promise(async (resolve) => {
      try {
        async.eachSeries(route.serviceGroups, async (serviceGroup) => {
          await Promise
            .all(serviceGroup.services.map(service => this.processService(service, context)))
            .then((serviceResponses) => {
              // Mounting service responses to context
              /* eslint array-callback-return: 0 */
              serviceResponses.every((service) => {
                const serviceKeyPrefix = `service.${service.key}`;
                const serviceResponse = service.data;
                context.bind(`${serviceKeyPrefix}.body`).to(serviceResponse.body);
                context.bind(`${serviceKeyPrefix}.status`).to(serviceResponse.statusCode || serviceResponse.status || serviceResponse.body.statusCode);

                bindHeadersToContext(serviceResponse.headers, context, serviceKeyPrefix);
              });
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

module.exports = RequestHandler;
