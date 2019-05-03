

const http = require('http');
const https = require('https');
const Koa = require('koa');
const { Context, inject } = require('@loopback/context');
const HTTPRequestHandler = require('./http-request-handler');
const { ApplicationBindings } = require('../utils/constants');
const { decorate, param } = require('../context');

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
    this._host = config.server.host || '0.0.0.0';
    this._protocol = config.server.protocol || 'http';
  }

  setupRequestHandler() {
    if (this.requestListener) return this.requestListener;

    // Initializing default request listener
    this.requestListener = new Koa();

    this.composeMiddlewares();

    // Initializing request handler
    this.httpRequestHandler = new HTTPRequestHandler(this);

    // Start listening the request and response to client
    this.requestListener.use(async (ctx, next) => {
      await this.httpRequestHandler.handleRequest(ctx.request, ctx.response);
      await next();
    });

    return this.requestListener;
  }

  get requestHandler() {
    return this._requestHandler;
  }

  /**
   * Starts the HTTP / HTTPS server
   */
  async start() {
    const requestListener = this.setupRequestHandler();

    if (this._protocol === 'https') {
      this.server = https.createServer(this.serverOptions, requestListener.callback());
    } else {
      this.server = http.createServer(requestListener.callback());
    }

    this.server.listen(this._port, this._host);

    // await pEvent(this.server, 'listening');
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
  protocol() {
    return this._protocol;
  }

  /**
   * Port number of the HTTP / HTTPS server
   */
  port() {
    return (this._address && this._address.port) || this._port;
  }

  /**
   * Host of the HTTP / HTTPS server
   */
  host() {
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
    return `${this._protocol}://${host}:${this.port}`;
  }

  /**
   * State of the HTTP / HTTPS server
   */
  listening() {
    return this._listening;
  }

  /**
   * Address of the HTTP / HTTPS server
   */
  address() {
    return this._listening ? this._address : undefined;
  }

  /**
   * Compose middleware is function to combining multiple
   * middlewares to sequencial execution.
   */
  composeMiddlewares() {
    const middlewareFn = this.getSync(ApplicationBindings.MIDDLEWARES);

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


module.exports = decorate([
  param(0, inject(ApplicationBindings.INSTANCE)),
], Server);
