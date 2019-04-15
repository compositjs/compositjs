const Koa = require('koa');
const cors = require('koa-cors');
const bodyparser = require('koa-bodyparser');
const { Context } = require('@loopback/context');

const Server = require('./server');
const middlewares = require('./middlewares');
const BootApplication = require('../boot/boot.application');

class Application extends Context {

  constructor(options = {}) {

    super();

    this.options = options;

    // Initializing default request listener
    this._listener = new Koa();    

    // BootApplication will load all the plugins configured in application configuration.
    const bootstrapper = new BootApplication(options);
    
    // Boot function will bind all the plugins to application context.
    bootstrapper.boot(this);

    // Modifying request listener as per configuration
    this._modifyListener();

    // Initializing default Server
    this._server = new Server(this, this._listener, this.options.server);
  }
  
  /**
   * Setting server for the application
   * 
   * @param { @luharjs/server } server Node Server
   */
  set server(server = null) {

    if(server !== null) {
      this._server = server;
    }
  }

  /**
   * Retrive server of the application
   * 
   * @return { @luharjs/server } Node Server
   */
  get server() {
    return this._server;
  }

  /**
   * Retrive request listener of the application
   * 
   * @return { listener } Koa | express
   */
  get app() {
    return this._listener;
  }

  /**
   * Setup route using specification   
   */
  route(route) {
    this._server.route(route);
  }

  /**
   * Modifying the listener as per the configuration
   * creating final request listenter object
   */
  _modifyListener() {

    // TODO: Body parser to be remove from here.
    this._listener.use(bodyparser({
      jsonLimit: process.env.BODY_PARSER_JSON_LIMIT || '5mb',
      onerror: err => {
        throw new Error('Body-Parser: error parsing input.')
      }
    }));
    
    // Setting cors for the application
    if(this.options.cors && this.options.cors.origin) {
      this._listener.use(cors(this.options.cors));
    }
    
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