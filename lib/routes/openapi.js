

const OpenAPIDefaultSetter = require('openapi-default-setter').default;
const OpenAPIRequestValidator = require('openapi-request-validator').default;
const OpenapiRequestCoercer = require('openapi-request-coercer').default;
const debug = require('debug')('compositjs:routing-table:open-api');

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
 * @param {object} request
 *
 * @returns {boolean}
 *
 */
module.exports.openAPIParameterResolver = (parameters, request) => {
  // Find any default value given on parameter array
  const defaultValue = parameters.some(parameter => parameter.default);

  if (defaultValue) {
    new OpenAPIDefaultSetter({ parameters }).handle(request);
  }

  // Effortlessly coerce header, path, query and formData request properties
  // to defined types in an openapi parameters list.
  new OpenapiRequestCoercer({ parameters }).coerce(request);

  // Validate parameters
  const errors = new OpenAPIRequestValidator({ parameters }).validate(request);

  if (errors) {
    debug('errors:', errors.errors.map(error => `${error.message}; missing from ${error.location}`));
    return false;
  }

  return true;
};
