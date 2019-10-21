
import * as fs from 'fs';
import * as path from 'path';

/**
 * Check synchronously if a filepath points to an existing file.
 * Replaces calls to fs.existsSync, which is deprecated (see:
 * https://github.com/nodejs/node/pull/166).
 *
 * @param   {String} filepath The absolute path to check
 * @returns {Boolean}  True if the file exists
 */
function fileExistsSync(filepath: string) {
  try {
    fs.statSync(filepath);
    return true;
  } catch (e) {
    return false;
  }
}

export function ifExists(file: string) {
  const filepath = path.resolve(file);
  return fileExistsSync(filepath) ? filepath : undefined;
}
