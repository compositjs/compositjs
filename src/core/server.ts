
import { inject } from '@loopback/context';
import debugFactory from 'debug';
import http from 'http';
import https from 'https';
import Koa from 'koa';
import { ApplicationBindings } from '../utils';
const debug = debugFactory('compositjs:server');

/**
 * HTTP / HTTPS server used
 *
 * @class Server
 *
 */

export default class Server {

  _port: number;
  _host: string;
  _protocol: string;
  _listening: any;
  _address: any;

  _middlewaresView: any;
  _listener: any;
  _requestHandler: any;
  _server: any;

  _serverOptions: any;

  /**
   * Server constructor
   *
   * - initialize root (app) context
   *
   * @param configuration
   */
  constructor(
    @inject(ApplicationBindings.INSTANCE) public app: any,
    @inject(ApplicationBindings.CONFIG) config: any,
  ) {

    this._port = config.server.port || 5000;
    this._host = config.server.host || undefined;
    this._protocol = config.server.protocol || 'http';

    this._middlewaresView = app.createView((binding: any) => binding.tagMap[ApplicationBindings.MIDDLEWARES] != null);
  }

  async setupRequestHandler() {

    // Initializing default request listener
    this._listener = new Koa();

    this._listener.use(await this.composeMiddlewares());

    const httpRequestHandler = this.app.getSync('http.requestHandler');

    // Start listener the request and response to client
    this._listener.use(async (ctx: any, next: any) => {
      await httpRequestHandler.handleRequest(ctx.request, ctx.response);
      await next();
    });

    return this._listener;
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
      this._server = https.createServer(this._serverOptions, listener.callback());
    } else {
      this._server = http.createServer(listener.callback());
    }

    this._server.listen(this._port, this._host);

    this._listening = true;
    this._address = this._server.address();
  }

  /**
   * Stops the HTTP / HTTPS server
   */
  async stop() {
    if (!this._server) return;
    this._server.close();
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
    let middlewareFns: any = [];

    try {
      middlewareFns = await this._middlewaresView.values();
    } catch (e) {
      debug('No middlewares found.');
      return (context: any, next: any) => next();
    }

    return (context: any, next: any) => {
      // last called middleware #
      let index = -1;
      function execute(i: any): any {
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
