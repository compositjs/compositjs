
const compose = require('koa-compose');

module.exports = (middlewares) => {

  let middlewareFunctions = [];

  for(let middleware of middlewares) {
    middlewareFunctions.push(middleware.getValue());
  }

  return compose(middlewareFunctions);
};
