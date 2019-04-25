"use strict";

const { Service } = require('../services');
const debug = require('debug')('service-composer:boorstraper');
const ConfigLoader = require('./loader');

/**
 * Boot application class responsible for binding configured plugins e.g
 * services, routes and middleware handlers to application context.
 * 
 */
class BootApplication {

  constructor(opts) {  

    if(!opts) {
      throw new Error('Bootstrapper requried options');
    }

    // Retriving application root folder.
    const appRootDir = opts.appRoot || process.cwd();

    let options = Object.assign({}, {
      options: {
        routes: {
          dir: appRootDir + '/definitions/routes/',
          extension: '.route.json'
        },
        services: {
          dir: appRootDir + '/definitions/services/',
          extension: '.service.json'
        },
        middlewares: {
          dir: appRootDir + '/middlewares/',
          extension: '.js'
        }
      }
    }, opts);

    // Loading all plugins
    this.configs = {
      env:          options.env || process.env.NODE_ENV || 'development',
      services:     ConfigLoader.loadPlugins(options.options.services) || [],
      routes:       ConfigLoader.loadPlugins(options.options.routes) || [],
      middlewares:  ConfigLoader.loadPlugins(options.options.middlewares) || []
    };

    debug("configurations:", this.configs);
  }

  /**
   * Boot function is responsible for initializing of binding process to application context
   * e.g. services, routes, middlewares etc.
   * 
   * @param {object} app 
   */
  boot(app) {

    // Register services first to accessing while route registration
    if(this.configs.services) {
      this._setupServices(app, this.configs.services);
    }

    if(this.configs.routes) {
      this._setupRoutes(app, this.configs.routes);
    } 

    if(this.configs.middlewares) {
      this._setupMiddlewares(app, this.configs.middlewares);
    } 
  }

  /**
   * Binding identified service to application context
   * 
   * @param {object} app 
   * @param {object} services 
   */
  _setupServices(app, services) {

    Object.keys(services).map((key) => {
      const serviceSpec = services[key];

      // Initializing service class object using service specification and binding to application context.
      app.bind(`service.${serviceSpec.info.name}`).toDynamicValue(() => new Service(serviceSpec)).lock();      
    });
  }

  /**
   * Bind identified route definitions to application context
   * 
   * @param {object} app 
   * @param {object} routes 
   */
  _setupRoutes(app, routes) {
    Object.keys(routes).map((key) => {     
      const route = routes[key];

      // Binding route definition specification to application context.
      app.bind(`route.${route.info.name}`).to(route).lock();
    }); 
  }
  
  /**
   * Binding identified middleware handlers to application context
   * 
   * @param {object} app 
   * @param {object} middlewares 
   */
  _setupMiddlewares(app, middlewares) {
    Object.keys(middlewares).map((key) => {     
      const middleware = middlewares[key];

      // Binding middleware handlers to application context.
      app.bind(`middleware.${key}`).to(middleware).lock();
    }); 
  }
}

module.exports = BootApplication;