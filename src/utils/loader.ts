
import debugFactory from 'debug';
import fs from 'fs';
import * as files from './files';

const debug = debugFactory('compositjs:boot:config-loader');

const ConfigLoder: any = {};


function hasCompatibleType(origValue: any, newValue: any) {
  if (origValue === null || origValue === undefined) { return true; }

  if (Array.isArray(origValue)) { return Array.isArray(newValue); }

  if (typeof origValue === 'object') { return typeof newValue === 'object'; }

  // Note: typeof Array() is 'object' too,
  // we don't need to explicitly check array types
  return typeof newValue !== 'object';
}


function mergeSingleItemOrProperty(target: any, config: any, key: any, fullKey: any) {
  const origValue = target[key];
  const newValue = config[key];

  if (!hasCompatibleType(origValue, newValue)) {
    return `Cannot merge values of incompatible types for the option \`${
      fullKey}\`.`;
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


function mergeObjects(target: any, config: any, keyPrefix: any = '') {
  Object.keys(config).forEach((key) => {
    const fullKey = keyPrefix ? `${keyPrefix}.${key}` : key;
    const err = mergeSingleItemOrProperty(target, config, key, fullKey);
    if (err) return err; return null;
  });
  return null; // no error
}


function mergeArrays(target: any, config: any, keyPrefix: any) {
  if (target.length !== config.length) {
    return `${'Cannot merge array values of different length'
      + ' for the option `'}${keyPrefix}\`.`;
  }

  // Use for(;;) to iterate over undefined items, for(in) would skip them.
  target.forEach((item: any, ix: any) => {
    const fullKey = `${keyPrefix}[${ix}]`;
    const err = mergeSingleItemOrProperty(target, config, ix, fullKey);
    if (err) return err; return null;
  });

  return null; // no error
}


/**
 * Load configuration files into an array of objects.
 * Attach non-enumerable `_filename` property to each object.
 * @param {Array.<String>} files
 * @returns {Array.<Object>}
 */
function loadFiles(files: any) {
  return files.map((f: any) => {
    const config = require(f);
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
function findFiles(dir: any, name: any) {
  const master = files.ifExists(`${dir}/${name}`);
  if (!master) {
    console.warn('WARNING: Main {{config}} file "%s.json" is missing', name);
  }
  if (!master) return [];

  const candidates = [];

  // Load default configuration files from core
  if (name === 'config') {
    candidates.push(files.ifExists(`${__dirname}/../configuration/${name}`));
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
function mergeConfigurations(configObjects: any, mergeFn: any) {
  const result = configObjects.shift() || {};
  while (configObjects.length) {
    const next = configObjects.shift();
    mergeFn(result, next, next._filename);
  }
  return result;
}

/**
 * Load named configuration.
 * @param {String} rootDir Directory where to look for files.
 * @param {String} env Environment, usually `process.env.NODE_ENV`
 * @param {String} name
 * @param {function(target:Object, config:Object, filename:String)} mergeFn
 * @returns {Object}
 */
function load(rootDir: string, name: string, mergeFn: any) {
  const files = findFiles(rootDir, name);
  if (files.length) {
    debug('found %s %s files', name);
    files.forEach((f) => { debug('  %s', f); });
  }
  const configs = loadFiles(files);
  const merged = mergeConfigurations(configs, mergeFn);
  debug('merged %s %s configuration %j', name, merged);

  return merged;
}

function mergeConfig(target: any, config: any, fileName: any) {
  const err = mergeObjects(target, config);
  if (err) {
    throw new Error(`Cannot apply ${fileName} ${err}`);
  }
}

ConfigLoder.loadAppConfig = (configRootDir: any) => load(configRootDir, 'config', mergeConfig);

ConfigLoder.loadPlugins = (options: any = {}) => {
  const plugins: any = [];
  const pluginFiles = fs.existsSync(options.dir) ? fs.readdirSync(options.dir) : [];
  pluginFiles.filter((file: any) => {
    // Finding *.js file from middlewares Directory
    if (file.match(`^(.*)${options.extension}`)) {
      // Removing file extension to find in folder
      plugins[file.replace(/\.[^/.]+$/, '')] = load(options.dir, file, mergeConfig);
    }
    return true;
  });

  return plugins;
};

export default ConfigLoder;
