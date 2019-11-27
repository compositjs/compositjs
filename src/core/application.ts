
import { BindingScope, Constructor, Context } from '@loopback/context';
import debugFactory from 'debug';
import { RestService } from '../services';
import { IApplicationConfiguration, IService } from '../utils';
import ConfigLoader from '../utils/loader';
import HTTPRequestHandler from './http-request-handler';
import Server from './server';

const { ApplicationBindings } = require('../utils');

const debug = debugFactory('compositjs:application');

const getDefaultConfigs = (appRootDir: string): IApplicationConfiguration => ({
  enviornment: 'dev',
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
  appRoot: '',
  server: {
    host: '',
    port: 5000,
    protocol: 'https'
  }
})

export default class Application extends Context {
  plugins: any;

  appConfig: IApplicationConfiguration;

  constructor(config: IApplicationConfiguration = {}) {
    super();

    // Retriving application root folder.
    const appRootDir: string = config.appRoot || process.cwd();

    // default configuration values
    this.appConfig = {
      ...getDefaultConfigs(appRootDir),
      ...config,
    };

    this.bind(ApplicationBindings.INSTANCE).to(this);

    this.bind(ApplicationBindings.CONFIG).to(this.appConfig);

    // Initializing default Server
    this.bind('server').toClass(Server).inScope(BindingScope.SINGLETON);

    // Initializing request handler
    this.bind('http.requestHandler').toClass(HTTPRequestHandler);

    this.bind('service.rest').to(RestService);

    // Loading all plugins
    this.plugins = {
      env: this.appConfig.enviornment || process.env.NODE_ENV || 'development',
      services: ConfigLoader.loadPlugins(this.appConfig.services) || [],
      routes: ConfigLoader.loadPlugins(this.appConfig.routes) || [],
      middlewares: ConfigLoader.loadPlugins(this.appConfig.middlewares) || [],
    };

    debug('configurations:', this.plugins);
  }

  /**
   * Retrive server of the application
   *
   * @return { server } Node Server
   */
  get server(): any {
    return this.getSync('server');
  }

  /**
   * Registering middleware function
   *
   * @param { function } middlewareFn
   */
  use(middlewareFn: any) {
    if (typeof middlewareFn !== 'function') throw new Error('Middleware should be function');

    try {
      const randomName = Math.random().toString(36).substring(10);
      this
        .bind(`${ApplicationBindings.MIDDLEWARES}.${randomName}`)
        .to(middlewareFn)
        .tag(`${ApplicationBindings.MIDDLEWARES}`)
        .lock();
    } catch (e) {
      debug('Errors while adding middlewares', e);
    }
  }

  /**
   * Starting application
   */
  async start() {
    this.boot();
    await this.server.start();
  }

  /**
   * Boot function is responsible for initializing of plugins and binding to application context
   * e.g. services, routes, middlewares etc.
   */
  boot() {
    // Register services first to accessing while route registration
    if (this.plugins.services) {
      Object.values(this.plugins.services).forEach((serviceSpec: any) => {
        this.configure(`service.${serviceSpec.info.name}`).to(serviceSpec).lock();
        const Service: Constructor<IService> = this.getSync(`service.${serviceSpec.service.type}`);
        this.bind(`service.${serviceSpec.info.name}`).toClass(Service).lock();
      });
    }

    if (this.plugins.routes) {
      Object.values(this.plugins.routes).forEach((route: any) => {
        this.bind(`route.${route.info.name}`).to(route).lock();
      });
    }

    if (this.plugins.middlewares) {
      Object.keys(this.plugins.middlewares).forEach((key: any) => {
        this
          .bind(`${ApplicationBindings.MIDDLEWARES}.${key}`)
          .to(this.plugins.middlewares[key])
          .tag(`${ApplicationBindings.MIDDLEWARES}`)
          .lock();
      });
    }
  }
}

module.exports = Application;
