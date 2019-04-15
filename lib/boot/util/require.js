module.exports = function requireModule(sourceFile) {
  var exports = require(sourceFile);
  return exports && exports.__esModule ? exports.default : exports;
};