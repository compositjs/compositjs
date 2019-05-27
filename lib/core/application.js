

const { Context, BindingScope } = require('@loopback/context');
const Server = require('./server');
const BootApplication = require('../boot/boot.application');
const { ApplicationBindings } = require('../utils/constants');

class Application extends Context {
  constructor(options = {}) {
    super();

    this.bind(ApplicationBindings.INSTANCE).to(this);

    this.bind(ApplicationBindings.CONFIG).to(options);

    // BootApplication will load all the plugins configured in application configuration.
    // Boot function will bind all the plugins to application context.
    new BootApplication(options).boot(this);

    // Initializing default Server
    this.bind('server').toClass(Server).inScope(BindingScope.SINGLETON);
  }

  /**
   * Retrive server of the application
   *
   * @return { server } Node Server
   */
  get server() {
    return this.getSync('server');
  }

  /**
   * Registering middleware function
   *
   * @param { function } middlewareFn
   */
  use(middlewareFn) {
    if (typeof middlewareFn !== 'function') throw new Error('Middleware should be function');

    let middlewares;

    try {
      middlewares = this.getSync(ApplicationBindings.MIDDLEWARES);
    } catch (e) {
      middlewares = [];
    }

    middlewares.push(middlewareFn);

    this.bind(ApplicationBindings.MIDDLEWARES).to(middlewares);
  }

  /**
   * Starting application
   */
  async start() {
    // Starting server
    await this.getSync('server').start();
  }
}

module.exports = Application;
