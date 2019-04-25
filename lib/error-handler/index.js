"use strict";

const httpErrors = require('./http-errors');
const handler = require('./handler');

module.exports = {
    ...httpErrors,
    ...handler
}