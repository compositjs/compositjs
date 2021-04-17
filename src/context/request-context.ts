
import { Context } from '@loopback/context';
import { URL } from 'url';
import { IRequestContext, RequestBindings } from '../utils';
import { extractHeadersAndCookies } from './helpers';

const querystring = require('querystring');

export default class RequestContext extends Context implements IRequestContext {
  constructor(
    public app: Context,
    public req: any,
    public res: any,
  ) {
    super(app);

    const { cookies, headers } = this._processRequestHeaders();
    const params = this._processRequestParams();

    this.bind(RequestBindings.REQUEST_PARAMS).to({ cookies, headers, params }).tag(RequestBindings.REQUEST_TAG_NAME);
  }

  _processRequestHeaders(): any {
    // If no x-request-id header available then setting context UUID as x-request-id
    if (this.req && this.req.headers && !this.req.headers['x-request-id']) {
      this.req.headers['x-request-id'] = this.name;
    }

    // Biniding request headers to this requestcontext with the prefix of `request`
    return extractHeadersAndCookies(this.req.headers);
  }

  _processRequestParams() {
    // The full HTTP request URI from the application.
    const uri = `${this.req.protocol}://${this.req.get('host')}${this.req.originalUrl}`
    const urlParsed = new URL(uri);
    const queryString = urlParsed.searchParams.toString()

    const requestParams: any = {
      method: this.req.method.toLowerCase(),
      uri: uri,
      path: urlParsed.pathname,
      search: urlParsed.search || '',
      querystring: queryString || '',
      query: querystring.decode(queryString) || {},
      queryParams: {},
      'content-type': this.req.get('content-type') || '',
      date: new Date(),
      body: this.req.body || ''
    }

    const query = (querystring.decode(queryString) || {});
    for (const key in query) {
      requestParams.queryParams[key] = query[key]
    }

    return requestParams
  }
}
