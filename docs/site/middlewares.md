---
id: middlewares
title: Middlewares
sidebar_label: Middlewares
---

Middlewares are the functions to be executed when HTTP requests are made to Composit JS. Composit JS uses `koa` as underlaying framework so, middlewares must be same as koa middlewares.

Example for middleware,

```js

const Application = require('compositjs');

(async () => {

    const config = {
        server: {
          port: process.env.PORT || 5000,
          host: process.env.HOST
        },
        appRoot: __dirname
    };

    const application = new Application(config);

    application.use(async (ctx, next) => {
      const start = Date.now();
      await next();
      const ms = Date.now() - start;
      console.log(`async ${ctx.method} ${ctx.url} - ${ms}ms`);
    });

    application.use((ctx, next) => {
      const start = Date.now();
      return next().then(() => {
        const ms = Date.now() - start;
        console.log(`common ${ctx.method} ${ctx.url} - ${ms}ms`);
      });
    });

    await application.start();

    console.log("Server start at:", application.server.url());

})();

```

You able to create middlewares as external file and save in `./middlewares` folder in root. Composit JS will load all file in booting phase.

e.g.

```js
// ./middlewares/test.js
module.exports = async (ctx, next) => {
    console.log('running middleware');
    await next();
};
```

**Note:** Composit JS using Koa framework as listener, its requrired to have `await next()` to continue the process.

**Note:** Using application configuration, can change directory path and extension of middleware files. See more [here](application.md#applicationConfiguration).



