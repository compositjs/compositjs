
import { config } from '@loopback/context';
import debugFactory from 'debug';
import RestserviceController from './rest-service.controller';
const debug = debugFactory('compositjs:service');


export default class Service {

  _service: any

  constructor(
    @config()
    public spec: any = {}
  ) {

    debug('Service name:', this.spec.info.name);
    debug('Service type:', this.spec.service.type);

    if (this.spec.service.type === 'rest') {
      this._service = new RestserviceController(this.spec);
    } else {
      throw new Error(`Service (${this.spec.info.name || ''}) specification not correct. Debug for more details.`);
    }
  }

  /**
   * Service execution will invoke the services registered.
   *
   * @param {Object} context
   */
  async execute(context: any) {
    const serviceResponse = await this._service.invoke(context);
    return serviceResponse;
  }
}
