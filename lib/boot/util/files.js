"use strict";

const fs = require('fs');
const path = require('path');

/**
 * Check synchronously if a filepath points to an existing file.
 * Replaces calls to fs.existsSync, which is deprecated (see:
 * https://github.com/nodejs/node/pull/166).
 *
 * @param   {String} filepath The absolute path to check
 * @returns {Boolean}  True if the file exists
 */
const fileExistsSync = exports.fileExistsSync = (filepath) => {
  try {
    fs.statSync(filepath);
    return true;
  } catch (e) {
    return false;
  }
}

exports.ifExistsWithAnyExt = (filepathWithoutExtn) => {
  return ifExists(filepathWithoutExtn + '.js') || ifExists(filepathWithoutExtn + '.json');
}

const ifExists = exports.ifExists = (file) => {
  let filepath = path.resolve(file);
  return fileExistsSync(filepath) ? filepath : undefined;
}

