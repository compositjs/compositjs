"use strict";

const utils = require('./util');
const debug = require('debug')('service-composer:boot:config-loader');
const fs = require('fs');

let ConfigLoder = exports

ConfigLoder.loadAppConfig = function(configRootDir) {
  return load(configRootDir, 'config', mergeConfig);
};

ConfigLoder.loadPlugins = function(options = {}) {
  let plugins = [];
  let pluginFiles = fs.readdirSync(options.dir);
  pluginFiles.filter(function(file) {
    // Finding *.js file from middlewares Directory
    if(file.match(`^(.*)${options.extension}`)) {
      // Removing file extension to find in folder
      plugins[file.replace(/\.[^/.]+$/, '')] = load(options.dir, file, mergeConfig);
    }    
  })

  return plugins;
};

/**
 * Load named configuration.
 * @param {String} rootDir Directory where to look for files.
 * @param {String} env Environment, usually `process.env.NODE_ENV`
 * @param {String} name
 * @param {function(target:Object, config:Object, filename:String)} mergeFn
 * @returns {Object}
 */
function load(rootDir, name, mergeFn) {
  var files = findFiles(rootDir, name);
  if (files.length) {
    debug('found %s %s files', name);
    files.forEach(function(f) { debug('  %s', f); });
  }
  var configs = loadFiles(files);  
  var merged = mergeConfigurations(configs, mergeFn);  
  debug('merged %s %s configuration %j', name, merged);

  return merged;
}

/**
 * Load configuration files into an array of objects.
 * Attach non-enumerable `_filename` property to each object.
 * @param {Array.<String>} files
 * @returns {Array.<Object>}
 */
function loadFiles(files) {
  return files.map(function(f) {
    var config = require(f);
    Object.defineProperty(config, '_filename', {
      enumerable: false,
      value: f,
    });
    debug('loaded config file %s: %j', f, config);
    return config;
  });
}

/**
 * Search `dir` for all files containing configuration for `name`.
 * @param {String} dir
 * @param {String} env Environment, usually `process.env.NODE_ENV`
 * @param {String} name
 * @returns {Array.<String>} Array of absolute file paths.
 */
function findFiles(dir, name) {
  var master = utils.files.ifExists(dir + '/' + name);  
  if (!master) {
    console.warn('WARNING: Main {{config}} file "%s.json" is missing', name);
  }
  if (!master) return [];

  let candidates = [];

  // Load default configuration files from core
  if(name === "config") {
    candidates.push(utils.files.ifExists(__dirname + '/../configuration/' + name));
  }

  // Load application defined configuration file
  candidates.push(master);

  return candidates.filter(Boolean);
}

/**
 * Merge multiple configuration objects into a single one.
 * @param {Array.<Object>} configObjects
 * @param {function(target:Object, config:Object, filename:String)} mergeFn
 */
function mergeConfigurations(configObjects, mergeFn) {
  var result = configObjects.shift() || {};
  while (configObjects.length) {
    var next = configObjects.shift();
    mergeFn(result, next, next._filename);
  }
  return result;
}

function mergeConfig(target, config, fileName) {
  var err = mergeObjects(target, config);
  if (err) {
    throw new Error(g.f('Cannot apply %s: %s', fileName, err));
  }
}

function mergeObjects(target, config, keyPrefix) {
  for (var key in config) {
    var fullKey = keyPrefix ? keyPrefix + '.' + key : key;
    var err = mergeSingleItemOrProperty(target, config, key, fullKey);
    if (err) return err;
  }
  return null; // no error
}

function mergeSingleItemOrProperty(target, config, key, fullKey) {
  var origValue = target[key];
  var newValue = config[key];

  if (!hasCompatibleType(origValue, newValue)) {
    return 'Cannot merge values of incompatible types for the option `' +
      fullKey + '`.';
  }

  if (Array.isArray(origValue)) {
    return mergeArrays(origValue, newValue, fullKey);
  }

  if (newValue !== null && typeof origValue === 'object') {
    return mergeObjects(origValue, newValue, fullKey);
  }

  target[key] = newValue;
  return null; // no error
}

function mergeObjects(target, config, keyPrefix) {
  for (var key in config) {
    var fullKey = keyPrefix ? keyPrefix + '.' + key : key;
    var err = mergeSingleItemOrProperty(target, config, key, fullKey);
    if (err) return err;
  }
  return null; // no error
}

function mergeArrays(target, config, keyPrefix) {
  if (target.length !== config.length) {
    return 'Cannot merge array values of different length' +
      ' for the option `' + keyPrefix + '`.';
  }

  // Use for(;;) to iterate over undefined items, for(in) would skip them.
  for (var ix = 0; ix < target.length; ix++) {
    var fullKey = keyPrefix + '[' + ix + ']';
    var err = mergeSingleItemOrProperty(target, config, ix, fullKey);
    if (err) return err;
  }

  return null; // no error
}

function hasCompatibleType(origValue, newValue) {
  if (origValue === null || origValue === undefined)
    return true;

  if (Array.isArray(origValue))
    return Array.isArray(newValue);

  if (typeof origValue === 'object')
    return typeof newValue === 'object';

  // Note: typeof Array() is 'object' too,
  // we don't need to explicitly check array types
  return typeof newValue !== 'object';
}