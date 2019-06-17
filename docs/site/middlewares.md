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

Another way of creating middleware, create middleware as external file and save inside `./middlewares` from root folder of the application, file extension should be `.js`. Composit JS will take all the files created inside `./middlewares` folder at booting phase.

e.g.

```js
// ./middlewares/test.js
module.exports = async (ctx, next) => {
    console.log('running middleware');
    await next();
};
```

**Note:** Using application configuration, can change directory path and extension of middleware files. See more [here](application.md#applicationConfiguration).



