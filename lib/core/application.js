const Koa = require('koa');
const { Context } = require('@loopback/context');

const Server = require('./server');
const middlewares = require('./middlewares');
const BootApplication = require('../boot/boot.application');

class Application extends Context {

  constructor(options = {}) {

    super();

    this.options = options;    
  }
  
  /**
   * Booting application
   */
  boot() {

    // Initializing default request listener
    this._listener = new Koa();    

    // BootApplication will load all the plugins configured in application configuration.
    const bootstrapper = new BootApplication(options);
    
    // Boot function will bind all the plugins to application context.
    bootstrapper.boot(this);

    // Modifying request listener as per configuration
    this._modifyListener();

    // Initializing default Server
    this._server = new Server(this);
  }

  /**
   * Registering middleware function
   * 
   * @param { function } middlewareFn
   */
  get use(middlewareFn) {

    if(typeof middlewareFn !==  'function') throw new Error("Middleware should be function");

    this.bind(`middleware.${middlewareFn.constructor.name}`).to(middlewareFn).lock();
  }

  /**
   * Modifying the listener as per the configuration
   * creating final request listenter object
   */
  _modifyListener() {
    
    this._listener.use(middlewares(this.find('middleware.*')));

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
}

module.exports = Application