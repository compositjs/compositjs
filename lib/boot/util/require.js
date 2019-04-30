

module.exports = function requireModule(sourceFile) {
  /* eslint global-require: 0 */
  /* eslint  import/no-dynamic-require: 0 */
  const exports = require(sourceFile);
  return exports && exports.__esModule ? exports.default : exports;
};
