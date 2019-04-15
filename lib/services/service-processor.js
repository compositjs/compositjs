'use strict'

let _ = require('lodash');
const async = require('async');
const { bindHeadersToContext } = require('../context');


function updateContext(context, serviceResponse, service) {
  
  let serviceKeyPrefix = `service.${service.id}`; 
  context.bind(`${serviceKeyPrefix}.body`).to(serviceResponse.body);
  context.bind(`${serviceKeyPrefix}.status`).to(serviceResponse.statusCode || serviceResponse.status || serviceResponse.body.statusCode);

  bindHeadersToContext(serviceResponse.headers, context, serviceKeyPrefix);
}

class ServiceProcessor {

  constructor(executableServices) {
    this.executableServices = executableServices;
  }

  async process(route, context) {

    const self = this;

    return new Promise(async (resolve, reject) => {
      try {
        await async.eachSeries(route.serviceGroups, async (serviceGroup) => {
          return await self.processServiceGroup(serviceGroup, context);
        }, resolve);
      } catch (err) {
        errors.handleError(err, route, context)
      }
    });
    
  }

  async processServiceGroup (serviceGroup, context) {

    const self = this;
    
    return new Promise(async (resolve, reject) => {  
      try {
        await async.each(serviceGroup.services, async (service) => {
          return await self.processService(service, context);
        }, resolve);
  
      } catch (err) {
        reject(err);
      }
    });
    
  }
  
  async processService (service, context) {
    
    let serviceResponse
    try {

      console.log(`Processing ${service.id} started.`);

      if(service.serviceName && this.executableServices[service.serviceName]) {

        serviceResponse = await this.executableServices[service.serviceName].execute(context);

      } else if(service.id && this.executableServices[service.id]){        
        
        serviceResponse = await this.executableServices[service.id].execute(context);      
      } 

      console.log(`Processing ${service.id} finised.`);

    } catch (err) {       
      console.log(err);
    }
    
    updateContext(context, serviceResponse, service)
  }
}

module.exports = ServiceProcessor;
