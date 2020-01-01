
import { Context } from '@loopback/context';
import url from 'url';
import { IRequestContext } from '../utils';
import { bindHeadersToContext } from './helpers';

const querystring = require('querystring');

export default class RequestContext extends Context implements IRequestContext {
  constructor(
    public req: any,
    public res: any,
  ) {
    super();

    this._populateHeaderVariables();
    this._populateRequestVariables();
  }

  _populateHeaderVariables() {
    // If no x-request-id header available then setting context UUID as x-request-id
    if (this.req && this.req.headers && !this.req.headers['x-request-id']) {
      this.req.headers['x-request-id'] = this.name;
    }

    // Biniding request headers to this requestcontext with the prefix of `request`
    bindHeadersToContext(this.req.headers, this, 'request');
  }

  _populateRequestVariables() {
    // The HTTP verb of this request.
    this.bind('request.method').to(this.req.method.toLowerCase());

    // The full HTTP request URI from the application.
    this.bind('request.uri').to(`${this.req.protocol}://${this.req.get('host')}${this.req.originalUrl}`);

    const urlParsed = url.parse(this.req.url, false);

    this.bind('request.path').to(urlParsed.pathname);
    this.bind('request.search').to(urlParsed.search || '');
    this.bind('request.querystring').to(urlParsed.query || '');
    this.bind('request.query').to(querystring.decode(urlParsed.query) || {});

    const query = (querystring.decode(urlParsed.query) || {});
    Object.keys(query).forEach((key) => this.bind(`request.query.${key}`).to(query[key]));

    this.bind('request.content-type').to(this.req.get('content-type') || '');
    this.bind('request.date').to(new Date());
    this.bind('request.body').to(this.req.body || Buffer.from([]));
  }
}
