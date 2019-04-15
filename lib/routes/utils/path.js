
const pathToRegExp = require('path-to-regexp');


/**
 * Validating and formatting with path-to-regexp
 * 
 * @param {String} path 
 * @returns {Object} route
 */
const validateAndFormatPath = (path = '/') => {
  
  let tokens = pathToRegExp.parse(path);
  for (const token of tokens) {
    if (typeof token === 'string') continue;
    if (typeof token.name === 'number') {
      throw new Error(`Unnamed parameter is not allowed in path '${path}'`);
    }
  }

  const keys = [];
  const regexp = pathToRegExp(path, keys, {strict: true, end: true});

  return {keys, regexp };
}

module.exports.validateAndFormatPath = validateAndFormatPath;