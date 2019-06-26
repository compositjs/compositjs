

import pathToRegExp from 'path-to-regexp';

/**
 * Validating and formatting with path-to-regexp
 *
 * @param {String} path
 * @returns {Object} route
 */
export function validateAndFormatPath(path = '/') {

  if(path == '/') {
    return { keys: [], regexp: new RegExp('^\/+$') };
  }

  const tokens = pathToRegExp.parse(path);
  Object.values(tokens).forEach((token) => {
    if (typeof token !== 'string' && typeof token.name === 'number') {
      throw new Error(`Unnamed parameter is not allowed in path '${path}'`);
    }
  });

  const keys: any = [];
  const regexp = pathToRegExp(path, keys, { strict: true, end: true });

  return { keys, regexp };
};
