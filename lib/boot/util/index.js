
const files = require('./files');
const requireModule = require('./require');

module.exports = {
  files,
  requireModule,

  /**
     * Given a function, returns true if it is a class, false otherwise.
     *
     * @param target The function to check if it's a class or not.
     * @returns {boolean} True if target is a class. False otherwise.
     */
  isClass: className => (typeof className === 'function' && className.toString().indexOf('class') === 0),
};
