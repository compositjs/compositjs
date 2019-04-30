

const Koa = require('koa');
const { Context } = require('@loopback/context');
const Server = require('./server');
const BootApplication = require('../boot/boot.application');

class Application extends Context {
  constructor(options = {}) {
    super();

    this.options = options;

    this.boot();
  }

  /**
   * Booting application
   */
  boot() {
    // Initializing default request listener
    this._listener = new Koa();

    // BootApplication will load all the plugins configured in application configuration.
    const bootstrapper = new BootApplication(this.options);

    // Boot function will bind all the plugins to application context.
    bootstrapper.boot(this);

    // Modifying request listener as per configuration
    this._modifyListener();

    // Initializing default Server
    this._server = new Server(this);
  }

  /**
   * Retrive server of the application
   *
   * @return { server } Node Server
   */
  get server() {
    return this._server;
  }

  /**
   * Registering middleware function
   *
   * @param { function } middlewareFn
   */
  use(middlewareFn) {
    if (typeof middlewareFn !== 'function') throw new Error('Middleware should be function');

    this.bind(`middleware.${middlewareFn.constructor.name}`).to(middlewareFn).lock();
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
    await this._server.start();
  }

  /**
   * Compose middleware is function to combining multiple
   * middlewares to sequencial execution.
   */
  composeMiddlewares() {
    const middlewareFn = Object.values(this.find('middleware.*')).forEach(middleware => middleware.getValue());

    return (context, next) => {
      // last called middleware #
      let index = -1;
      function execute(i) {
        if (i <= index) return Promise.reject(new Error('next() called multiple times'));
        index = i;
        let fn = middlewareFn[i];
        if (i === middlewareFn.length) fn = next;
        if (!fn) return Promise.resolve();
        try {
          return Promise.resolve(fn(context, execute.bind(null, i + 1)));
        } catch (err) {
          return Promise.reject(err);
        }
      }
      return execute(0);
    };
  }
}

module.exports = Application;
