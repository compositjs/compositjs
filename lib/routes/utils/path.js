

const pathToRegExp = require('path-to-regexp');

/**
 * Validating and formatting with path-to-regexp
 *
 * @param {String} path
 * @returns {Object} route
 */
const validateAndFormatPath = (path = '/') => {
  const tokens = pathToRegExp.parse(path);
  Object.values(tokens).forEach((token) => {
    if (typeof token !== 'string' && typeof token.name === 'number') {
      throw new Error(`Unnamed parameter is not allowed in path '${path}'`);
    }
  });

  const keys = [];
  const regexp = pathToRegExp(path, keys, { strict: true, end: true });

  return { keys, regexp };
};

module.exports.validateAndFormatPath = validateAndFormatPath;
