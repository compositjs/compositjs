
import { inject } from '@loopback/context';
import async from 'async';
import cookie from 'cookie';
import { bindHeadersToContext, getParamsFromContext, RequestContext } from '../context';
import RoutingTable from '../routes/routing-table';
import { ApplicationBindings } from '../utils';


const buildResponse = async (route: any, context: any, response: any) => {
  if (!route.output) {
    throw new Error('Output not defined in route');
  }

  const headerparams = getParamsFromContext(route.output.headers, context);
  Object.keys(headerparams).map(headerparam => response.set(headerparam, headerparams[headerparam]));

  const newCookies: any = [];
  const cookieparams = getParamsFromContext(route.output.cookies, context);
  Object.keys(cookieparams).map(cookiename => newCookies.push(cookie.serialize(cookiename, cookieparams[cookiename].value, cookieparams[cookiename])));

  if (newCookies.length > 0) {
    response.set('set-cookie', [...newCookies]);
  }

  // Combining all services output as JSON object
  if (route.output.strategy === 'composit') {
    const compositBody: any = {};
    const s: any = [];
    context.findByTag(new RegExp(/^service\.(.+)/)).map((binding: any) => s.push(...binding.tagNames));
    let outputServices: any = null;

    // If no services mentioned take all services
    if (!route.output.services) {
      outputServices = [...Array.from(new Set(s))].map((serviceKey: any) => serviceKey.replace('service.', ''));
    } else {
      outputServices = route.output.services;
    }

    Object.values(outputServices).forEach((service: any) => {
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
export default class HTTPRequestHandler {

  routingTable: any;
  /**
   * Request handler
   *
   * - intialize server content
   *
   * @param rootContext
   */
  constructor(@inject(ApplicationBindings.INSTANCE) public app: any) {

    this.routingTable = new RoutingTable();

    Object.values(app.find('route.*')).forEach((specs: any) => this.routingTable.register(specs.getValue()));
  }

  async handleRequest(request: any, response: any) {

    // Creating RequestContext
    const requestContext = new RequestContext(request, response);

    // Finding route
    const route = this.routingTable.find(requestContext);

    // If route found
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

  async processRoute(route: any, context: any) {
    return new Promise(async (resolve: any) => {
      try {
        async.eachSeries(route.serviceGroups, async (serviceGroup: any) => {

          const services = serviceGroup.services.map((service: any) => this.processService(service, context));
          await Promise.all(services).catch((err) => console.log(err));

        }, resolve);
      } catch (err) {
        console.log(err);
      }
    });
  }

  async processService(serviceConfig: any, context: any) {
    const self = this;

    return new Promise(async (resolve) => {
      try {
        console.log(`Processing ${serviceConfig.id} started.`);

        // Retriving service by id or serviceName
        const service: any = self.app.getSync(`service.${serviceConfig.serviceName || serviceConfig.id}`);

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
