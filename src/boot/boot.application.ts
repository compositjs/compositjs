

import { inject, Context } from '@loopback/context';
import debugFactory from 'debug';
import { ApplicationBindings } from '../utils';
import ConfigLoader from './loader';
import { IApplicationConfiguration } from '../utils/types';
import { ServiceFactory } from '../services';
const debug = debugFactory('compositjs:boorstraper');

/**
 * Boot application class responsible for binding configured plugins e.g
 * services, routes and middleware handlers to application context.
 */
export default class BootApplication {

  configs: any;

  constructor(
    @inject(ApplicationBindings.CONFIG)
    config: IApplicationConfiguration
  ) {

    // Retriving application root folder.
    const appRootDir = config.appRoot || process.cwd();

    const options = Object.assign({}, {
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
    }, config);

    // Loading all plugins
    this.configs = {
      env: options.env || process.env.NODE_ENV || 'development',
      services: ConfigLoader.loadPlugins(options.services) || [],
      routes: ConfigLoader.loadPlugins(options.routes) || [],
      middlewares: ConfigLoader.loadPlugins(options.middlewares) || [],
    };

    debug('configurations:', this.configs);
  }

  /**
   * Boot function is responsible for initializing of binding process to application context
   * e.g. services, routes, middlewares etc.
   *
   * @param {object} app
   */
  boot(app: Context) {

    // Register services first to accessing while route registration
    if (this.configs.services) {
      Object.values(this.configs.services).forEach((serviceSpec: any) => {
        app.configure(`service.${serviceSpec.info.name}`).to(serviceSpec).lock();
        app.bind(`service.${serviceSpec.info.name}`).toClass(ServiceFactory).lock();
      });
    }

    if (this.configs.routes) {
      Object.values(this.configs.routes).forEach((route: any) => {
        app.bind(`route.${route.info.name}`).to(route).lock();
      });
    }

    if (this.configs.middlewares) {
      Object.keys(this.configs.middlewares).forEach((key: any) => {
        app
          .bind(`${ApplicationBindings.MIDDLEWARES}.${key}`)
          .to(this.configs.middlewares[key])
          .tag(`${ApplicationBindings.MIDDLEWARES}`)
          .lock();
      });
    }
  }
}
