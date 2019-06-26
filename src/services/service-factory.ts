
import { config } from '@loopback/context';
import debugFactory from 'debug';
import RestService from './rest-service';
import { IService, IRequestContext } from '../utils';
const debug = debugFactory('compositjs:service');

export default class ServiceFactory {

  _service: IService;

  constructor(
    @config()
    public spec: any = {}
  ) {

    debug('Service name:', this.spec.info.name);
    debug('Service type:', this.spec.service.type);

    if (this.spec.service.type === 'rest') {
      this._service = new RestService(this.spec);
    } else {
      throw new Error(`Service (${this.spec.info.name || ''}) specification not correct. Debug for more details.`);
    }
  }

  /**
   * Service execution will invoke the services registered.
   *
   * @param {Object} context
   */
  async execute(context: IRequestContext) {
    const serviceResponse = await this._service.invoke(context);
    return serviceResponse;
  }
}
