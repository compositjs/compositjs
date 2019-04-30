

const http = require('http');
const https = require('https');
const { Context } = require('@loopback/context');
const RequestHandler = require('./request-handler');

/**
 * HTTP / HTTPS server used
 *
 * @class Server
 *
 */

class Server extends Context {
  /**
   * @param requestListener
   * @param serverOptions
   */
  constructor(app) {
    super(app);
    const serverOptions = app.options.server;

    this.requestListener = app.requestListener;
    this.serverOptions = app.options.server;
    this._port = serverOptions ? serverOptions.port || 0 : 0;
    this._host = serverOptions ? serverOptions.host : undefined;
    this._protocol = serverOptions ? serverOptions.protocol || 'http' : 'http';

    this._setupRequestHandler();
  }

  _setupRequestHandler() {
    // Initializing request handler
    this._requestHandler = new RequestHandler(this);

    // Start listening the request and response to client
    this.requestListener.use(async (ctx, next) => {
      await this.requestHandler.handleRequest(ctx.request, ctx.response);
      await next();
    });
  }

  /**
   *
   */
  get requestHandler() {
    return this._requestHandler;
  }

  /**
   * Starts the HTTP / HTTPS server
   */
  async start() {
    if (this._protocol === 'https') {
      this.server = https.createServer(this.serverOptions, this.requestListener.callback());
    } else {
      this.server = http.createServer(this.requestListener.callback());
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
}

module.exports = Server;
