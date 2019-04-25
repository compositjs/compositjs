"use strict";

const { RequestContext } = require('../context');
const { Context } = require('@loopback/context');
const RoutingTable = require('../routes/routing-table');
let _ = require('lodash');
const async = require('async');
const { bindHeadersToContext } = require('../context');


class RequestHandler extends Context {

  constructor(server) {

    super(server);
    
    this.routingTable = new RoutingTable();
    
    for(let specs of this.find('route.*')) {
      this.routingTable.register(specs.getValue());
    }
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

      await this.process(route, request.ctx);

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
      throw new Error(`Output not defined in route`);
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


  async process(route, context) {

    const self = this;

    return new Promise(async (resolve, reject) => {
      
      try {
        async.eachSeries(route.serviceGroups, async (serviceGroup) => {       
          
          await Promise.all(serviceGroup.services.map((serviceConfig) => {

            return new Promise(async (resolve, reject) => {

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
          })).then((serviceResponses) => {
            
            // Mounting service responses to context
            serviceResponses.map((service) => {

              let serviceKeyPrefix = `service.${service.key}`;
              let serviceResponse = service.data;
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
}

module.exports = RequestHandler;