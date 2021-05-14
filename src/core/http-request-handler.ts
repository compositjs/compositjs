
import { Binding, Context, ContextEventType, ContextView, inject } from '@loopback/context';
import cookie from 'cookie';
import debugFactory from 'debug';
import { isEqual } from 'lodash';
import { extractHeadersAndCookies, getParamsFromContext, RequestContext } from '../context';
import RoutingTable from '../routes/routing-table';
import { ApplicationBindings, IRequestContext, RequestBindings, RouteBindings, ServiceBindings } from '../utils';
import { processActions } from './conditions';

const debug = debugFactory('compositjs:core:http-request-handler');

const servicesFilter = (binding: Readonly<Binding<unknown>>) => binding.tagMap.service != null;

const buildResponse = (context: IRequestContext, response: any) => {
  const output: any = context.getSync(RouteBindings.ROUTE_OUTPUT);
  if (!output) {
    throw new Error('Output not defined in route');
  }

  let serviceResponse: any = null;
  const headerparams = getParamsFromContext(output.headers, context);
  Object.keys(headerparams).map((headerparam) => response.set(headerparam, headerparams[headerparam]));

  const newCookies: any = [];
  const cookieparams = getParamsFromContext(output.cookies, context);
  for (const cookiename in cookieparams) {
    if (
      (typeof cookieparams[cookiename] === 'string' && cookieparams[cookiename] != '') ||
      cookieparams[cookiename].value != undefined
    ) {
      newCookies.push(cookie.serialize(cookiename, cookieparams[cookiename].value || cookieparams[cookiename], cookieparams[cookiename]))
    }
  }

  if (newCookies.length > 0) {
    response.set('set-cookie', [...newCookies]);
  }

  // Combining all services output as JSON object
  if (output.strategy === 'composit') {
    const compositBody: any = {};
    let outputServices: string[] = [];

    // If no services mentioned take all services
    if (!output.services) {
      outputServices = context.findByTag(ServiceBindings.SERVICE_TAG_NAME).map((bind: Readonly<Binding<unknown>>) => bind.key)
    } else {
      outputServices = output.services;
    }
    outputServices.map((service: string) => {
      try {
        serviceResponse = context.getSync(service)
        compositBody[service] = serviceResponse.body
      } catch (err) {
        console.log('err', service)
        compositBody[service] = '';
      }
    });

    response.body = compositBody;
    response.status = output.status ? +getParamsFromContext(output.status, context) : 200;
    // Straight forward output from given service
  } else if (output.strategy === 'standard') {
    serviceResponse = context.getSync(output.service)
    response.body = serviceResponse.body;
    response.status = output.status ? +getParamsFromContext(output.status, context) : 200;
  } else if (output.body) {
    response.body = output.body;
    response.status = output.status ? +(output.status) : 200;
  }

  return response;
};

const serviceObserver = (abortController: AbortController, serviceView: ContextView) => {
  return {
    // Only interested in bindings tagged with `foo`
    filter: (binding: Readonly<Binding<unknown>>) => binding.tagMap.service != null,

    observe(event: ContextEventType, binding: Readonly<Binding<unknown>>, context: Context) {
      if (event === 'bind') {
        console.log('executed: %s %s', context.name, binding.key);
      }
    },
  }
};

const processService = async (serviceConfig: any, context: IRequestContext, ac: AbortController) => {
  let body = '';
  try {
    debug(`Processing ${serviceConfig.id} started.`);
    let serviceOutput: any = {}
    const preActionKey: string = ServiceBindings.SERVICE_PRE_ACTION_KEY(serviceConfig.id)
    const preActionResponse: any = <any>await processActions(serviceConfig, context, preActionKey)
    if (preActionResponse) {
      serviceOutput = { ...preActionResponse }
    } else {
      // Retriving service by id or serviceName
      const service: any = await context.get(`service.${serviceConfig.id}`);

      // Executing service
      const serviceResponse = await service.execute(context, { ...serviceConfig });

      debug(`Processing ${serviceConfig.id} finised.`);
      const { cookies, headers } = extractHeadersAndCookies(serviceResponse.headers || {});
      serviceOutput.cookies = cookies
      serviceOutput.headers = headers

      if (serviceResponse.body.constructor.name === "RequestResponse") {
        serviceResponse.body.setEncoding('utf8')
        for await (const data of serviceResponse.body) {
          body += data;
        }

        // If headers accept defined, and it is JSON then parse the body
        if (typeof headers['content-type'] == "string" && headers['content-type'].indexOf('application/json') > -1) {
          body = JSON.parse(body);
        }
      } else {
        body = serviceResponse.body;
      }
      serviceOutput.body = body
      serviceOutput.status = serviceResponse.statusCode || serviceResponse.status || serviceResponse.body.statusCode
    }
    const postActionKey: string = ServiceBindings.SERVICE_POST_ACTION_KEY(serviceConfig.id)
    const postActionResponse: any = <any>await processActions(serviceConfig, context, postActionKey)
    if (postActionResponse) {
      serviceOutput = { ...postActionResponse }
    }

    if (serviceOutput.stopServiceFlowExecution) {
      context.bind(RouteBindings.ROUTE_OUTPUT).to({ ...serviceOutput.output });
      ac.abort()
    }
    context.bind(serviceConfig.id).to(serviceOutput.output || serviceOutput).tag(ServiceBindings.SERVICE_TAG_NAME);

  } catch (err) {
    debug(err);
    throw err;
  }
}

/**
 *
 * @param {*} server
 */
export default class HTTPRequestHandler {
  routingTable: RoutingTable;

  /**
   * Request handler
   *
   * - intialize server content
   *
   * @param rootContext
   */
  constructor(@inject(ApplicationBindings.INSTANCE) public app: Context) {
    this.routingTable = new RoutingTable();
    Object.values(app.find('route.*')).forEach((specs: any) => {
      this.routingTable.register(specs.getValue(app))
    });
  }

  async handleRequest(request: any, response: any) {
    const self = this
    return new Promise<void>(async (resolve, reject) => {
      const ac = new AbortController();
      const signal = ac.signal;
      // Creating RequestContext
      const requestContext: IRequestContext = new RequestContext(this.app, request, response);
      const serviceView: ContextView = requestContext.createView(servicesFilter);
      requestContext.subscribe(serviceObserver(ac, serviceView))

      // Finding route
      const route: any = this.routingTable.find(requestContext);

      if (route) {
        requestContext.bind(RouteBindings.ROUTE_OUTPUT).to(route.output);
        const nonDependedServices: object[] = route.services.filter((service: any) => !service.dependsOn)
        const dependedServices: object[] = route.services.filter((service: any) => service.dependsOn)

        // Binding path parameters with current request context
        const requestParams: any = requestContext.getSync(RequestBindings.REQUEST_PARAMS)
        requestParams.params.pathParams = route.pathParams
        requestContext.bind(RequestBindings.REQUEST_PARAMS).to(requestParams).tag(RequestBindings.REQUEST_TAG_NAME);

        serviceView.on("bind", async () => {
          const services: object[] = <object[]>await serviceView.values();
          const completedServices: string[] = serviceView.bindings.map(bind => bind.key);

          if (services.length == route.services.length || signal.aborted) {
            buildResponse(requestContext, response);
            resolve();
          } else {
            dependedServices.map((service: any) => {
              if (isEqual(service.dependsOn.sort(), completedServices.sort())) {
                return processService(service, requestContext, ac);
              }
            })
          }
        })

        nonDependedServices.map((service: any) => processService(service, requestContext, ac));

      } else {
        response.body = '';
        response.status = 404;
        resolve();
      }
    })
  }
}
