
import { BindingScope, Context } from '@loopback/context';
import debugFactory from 'debug';
import BootApplication from '../boot/boot.application';
import HTTPRequestHandler from './http-request-handler';
import Server from './server';
import { IApplicationConfiguration } from '../utils';
const { ApplicationBindings } = require('../utils');
const debug = debugFactory('compositjs:application');

export default class Application extends Context {

  constructor(options: IApplicationConfiguration) {

    super();

    this.bind(ApplicationBindings.INSTANCE).to(this);

    this.bind(ApplicationBindings.CONFIG).to(options);

    // BootApplication will load all the plugins configured in application configuration.
    // Boot function will bind all the plugins to application context.
    new BootApplication(options).boot(this);

    // Initializing default Server
    this.bind('server').toClass(Server).inScope(BindingScope.SINGLETON);

    // Initializing request handler
    this.bind('http.requestHandler').toClass(HTTPRequestHandler);
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
    await this.server.start();
  }
}

module.exports = Application;
