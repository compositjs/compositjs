"use strict";

module.exports = (middlewares) => {

  let middlewareFn = [];

  for(let middleware of middlewares) {
    middlewareFn.push(middleware.getValue());
  }

  return (context, next) => {
    // last called middleware #
    let index = -1
    return execute(0)
    function execute (i) {
      if (i <= index) return Promise.reject(new Error('next() called multiple times'))
      index = i
      let fn = middlewareFn[i]
      if (i === middlewareFn.length) fn = next
      if (!fn) return Promise.resolve()
      try {
        return Promise.resolve(fn(context, execute.bind(null, i + 1)));
      } catch (err) {
        return Promise.reject(err)
      }
    }
  };
};
