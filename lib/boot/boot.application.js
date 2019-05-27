

const debug = require('debug')('compositjs:boorstraper');
const { Service } = require('../services');
const ConfigLoader = require('./loader');
const { ApplicationBindings } = require('../utils/constants');
const { paramDecorate } = require('../context');

/**
 * Boot application class responsible for binding configured plugins e.g
 * services, routes and middleware handlers to application context.
 *
 */
class BootApplication {
  constructor(config) {
    const opts = config;

    // Retriving application root folder.
    const appRootDir = opts.appRoot || process.cwd();

    const options = Object.assign({}, {
      options: {
        routes: {
          dir: `${appRootDir}/definitions/routes/`,
          extension: '.route.json',
        },
        services: {
          dir: `${appRootDir}/definitions/services/`,
          extension: '.service.json',
        },
        middlewares: {
          dir: `${appRootDir}/middlewares/`,
          extension: '.js',
        },
      },
    }, opts);

    // Loading all plugins
    this.configs = {
      env: options.env || process.env.NODE_ENV || 'development',
      services: ConfigLoader.loadPlugins(options.options.services) || [],
      routes: ConfigLoader.loadPlugins(options.options.routes) || [],
      middlewares: ConfigLoader.loadPlugins(options.options.middlewares) || [],
    };

    debug('configurations:', this.configs);
  }

  /**
   * Boot function is responsible for initializing of binding process to application context
   * e.g. services, routes, middlewares etc.
   *
   * @param {object} app
   */
  boot(app) {
    // Register services first to accessing while route registration
    if (this.configs.services) {
      Object.values(this.configs.services).forEach((serviceSpec) => {
        app.bind(`service.${serviceSpec.info.name}`).toDynamicValue(() => new Service(serviceSpec)).lock();
      });
    }

    if (this.configs.routes) {
      Object.values(this.configs.routes).forEach((route) => {
        app.bind(`route.${route.info.name}`).to(route).lock();
      });
    }

    if (this.configs.middlewares) {
      Object.keys(this.configs.middlewares).forEach((key) => {
        app.bind(`middleware.${key}`).to(this.configs.middlewares[key]).lock();
      });
    }
  }
}

// const BootApplicationDecorated = decorate([
//   param(0, inject(ApplicationBindings.CONFIG)),
//   param(1, inject(ApplicationBindings.INSTANCE)),
// ], BootApplication);

// module.exports = BootApplicationDecorated;

module.exports = paramDecorate(BootApplication, [ApplicationBindings.CONFIG, ApplicationBindings.INSTANCE]);
