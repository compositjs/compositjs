
import debugFactory from 'debug';
import OpenAPIDefaultSetter from 'openapi-default-setter';
import OpenAPIRequestCoercer from 'openapi-request-coercer';
import OpenAPIRequestValidator from 'openapi-request-validator';

const debug = debugFactory('compositjs:routing-table:open-api');

/**
 * Open API parameter resolver.
 *
 * This function responsible for resolving parameters for given request, which includes
 *
 * - Setting default value for parameter
 * - Type coercer
 * - Validation of parameter
 *
 * it will return 'false' if any validation error occurs else 'true'
 *
 * @param {Array} parameters
 * @param {object} requestParameters
 *
 * @returns {boolean}
 *
 */
export default function openAPIParameterResolver(parameters: any, requestParameters: any) {
  // If any default value given in a route parameters array, then run default setter
  const defaultValue = parameters.some((parameter: any) => parameter.default);
  if (defaultValue) {
    new OpenAPIDefaultSetter({ parameters }).handle(requestParameters);
  }

  // Effortlessly coerce header, path, query and formData request properties
  // to defined types in an openapi parameters list.
  new OpenAPIRequestCoercer({ parameters }).coerce(requestParameters);

  // Validate parameters
  const jsonSchema: any = {
    query: {},
    params: {}
  }
  const accumParams = parameters.reduce((accum: any, param: any) => {
    if (!accum[param.in]) accum[param.in] = []
    accum[param.in].push(param)
    return accum
  }, {})

  const errors: any = new OpenAPIRequestValidator({ parameters }).validateRequest(requestParameters);

  if (errors) {
    debug('errors:', errors.errors.map((error: any) => `${error.message}; missing from ${error.location}`));
    return false;
  }

  return true;
}
