const { RequestContext } = require('../context');
const { Context } = require('@loopback/context');
const ServiceProcessor = require('../services/service-processor');
const RoutingTable = require('../routes/routing-table');

class RequestHandler extends Context {

  constructor(server) {

    super(server);
    
    this.routingTable = new RoutingTable();
    
    for(let specs of this.find('route.*')) {
      this.routingTable.register(specs.getValue());
    }
    
    let executableServices = {};
    for(let service of this.find('service.*')) {
      executableServices[service.key.replace('service.', '')] = service.valueConstructor;
    }

    this.serviceProcessor = new ServiceProcessor(executableServices);
  }

  async handleRequest(request, response) {
    
    request.ctx = new RequestContext(request, response);
    
    const route = this.routingTable.find(request);

    if(route) {

      // Binding path parameters with current request context
      for (var key in route.pathParams) request.ctx.bind(`request.path.${key}`).to(route.pathParams[key]);

      if(route == null) {
        response.body = "";
        response.status = 404;
        return;
      }

      await this.serviceProcessor.process(route, request.ctx);

      const routeResponse = await this.buildResponse(route, request.ctx);

      response.body = routeResponse.body; 
      response.status = routeResponse.status;
      
    } else {

      response.body = "";
      response.status = 404;
    }
  }

  async buildResponse(route, context) {

    if(!route.output){
      throw new Error(`Response not defined in route`);
    }

    let response = {
      body: {},
      status: 200
    };

    if(route.output.strategy === 'composit') {

      for(let i=0; i < route.output.services.length; i++) {
        let service = route.output.services[i];
        response.body[service] = context.getSync(`service.${service}.body`);
      }
    }

    return response;
  }
}

module.exports = RequestHandler;