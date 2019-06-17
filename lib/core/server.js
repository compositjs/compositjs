
const debug = require('debug')('compositjs:server');
const http = require('http');
const https = require('https');
const Koa = require('koa');
const { Context } = require('@loopback/context');
const HTTPRequestHandler = require('./http-request-handler');
const { ApplicationBindings } = require('../utils/constants');
const { paramDecorate } = require('../context');

/**
 * HTTP / HTTPS server used
 *
 * @class Server
 *
 */

class Server extends Context {
  /**
   * Server constructor
   *
   * - initialize root (app) context
   *
   * @param configuration
   */
  constructor(appInstance) {
    super(appInstance);

    const config = this.getSync(ApplicationBindings.CONFIG);

    this._port = config.server.port || 5000;
    this._host = config.server.host || undefined;
    this._protocol = config.server.protocol || 'http';

    this._middlewaresView = this.createView(binding => binding.tagMap[ApplicationBindings.MIDDLEWARES] != null);
  }

  async setupRequestHandler() {
    if (this.requestListener) return this.requestListener;

    // Initializing default request listener
    this.listener = new Koa();

    this.listener.use(await this.composeMiddlewares());

    // Initializing request handler
    this.httpRequestHandler = new HTTPRequestHandler(this);

    // Start listener the request and response to client
    this.listener.use(async (ctx, next) => {
      await this.httpRequestHandler.handleRequest(ctx.request, ctx.response);
      await next();
    });

    return this.listener;
  }

  get requestHandler() {
    return this._requestHandler;
  }

  /**
   * Starts the HTTP / HTTPS server
   */
  async start() {
    const listener = await this.setupRequestHandler();

    if (this._protocol === 'https') {
      this.server = https.createServer(this.serverOptions, listener.callback());
    } else {
      this.server = http.createServer(listener.callback());
    }

    this.server.listen(this._port, this._host);

    this._listening = true;
    this._address = this.server.address();
  }

  /**
   * Stops the HTTP / HTTPS server
   */
  async stop() {
    if (!this.server) return;
    this.server.close();
    // await pEvent(this.server, 'close');
    this._listening = false;
  }

  /**
   * Protocol of the HTTP / HTTPS server
   */
  get protocol() {
    return this._protocol;
  }

  /**
   * Port number of the HTTP / HTTPS server
   */
  get port() {
    return (this._address && this._address.port) || this._port;
  }

  /**
   * Host of the HTTP / HTTPS server
   */
  get host() {
    return (this._address && this._address.address) || this._host;
  }

  /**
   * URL of the HTTP / HTTPS server
   */
  url() {
    let { host } = this;
    if (this._address.family === 'IPv6') {
      if (host === '::') host = '::1';
      host = `[${host}]`;
    } else if (host === '0.0.0.0') {
      host = '127.0.0.1';
    }
    return `${this.protocol}://${host}:${this.port}`;
  }

  /**
   * State of the HTTP / HTTPS server
   */
  listening() {
    return this._listening;
  }

  /**
   * Compose middleware is function to combining multiple
   * middlewares to sequencial execution.
   */
  async composeMiddlewares() {
    let middlewareFns = [];

    try {
      middlewareFns = await this._middlewaresView.values();
    } catch (e) {
      debug('No middlewares found.');
      return (context, next) => next();
    }

    /* eslint consistent-return: 0 */
    return (context, next) => {
      // last called middleware #
      let index = -1;
      function execute(i) {
        if (i <= index) return Promise.reject(new Error('next() called multiple times'));
        index = i;
        let fn = middlewareFns[i];
        if (i === middlewareFns.length) fn = next;
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

module.exports = paramDecorate(Server, [ApplicationBindings.INSTANCE]);
