---
id: configuration
title: Application configuration
sidebar_label: Configurations
---

You can configure the composit JS by passing it to application instance.

```js

const config = {
  server: {
    port: 8001,
    host: 'localhost'
  },
  appRoot: __dirname
};

const application = new Application(config);

await application.start();

```

|Options     | Type    | Default                                 | Description                                     |
|------------|---------|-----------------------------------------|-------------------------------------------------|
| `appRoot`  | string  | Current working dir (process.cwd())     | This identifies the Application root folder     |

