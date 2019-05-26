

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

    this.bind(ApplicationBindings.MIDDLEWARES).to([]);
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

    const middlewares = this.getSync(`${ApplicationBindings.MIDDLEWARES}`) || [];
    middlewares.push(middlewareFn);

    this.bind(`${ApplicationBindings.MIDDLEWARES}`).to(middlewares);
  }

  /**
   * Modifying the listener as per the configuration
   * creating final request listenter object
   */
  _modifyListener() {
    this._listener.use(this.composeMiddlewares());

    // Koa callback for starting application
    this.requestListener = this._listener;
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
