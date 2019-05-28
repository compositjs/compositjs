---
id: application
title: Application
sidebar_label: Application
---

`Application` is main class for the configuring all route API's and services. Also, it is a bootstrap class for starting your application. 

### <a name="applicationConfiguration"></a>Configuration

Composit JS can be configure using constructor arguments to application instance.

```js

const Application = require('compositjs');

const config = {
  server: {
    port: 8001,
    host: 'localhost'
  },
  appRoot: __dirname
};

(async () => {

  const application = new Application(config);

  await application.start();

})();

```

|Options     | Type    |  Description                                    |
|------------|---------|-------------------------------------------------|
| `appRoot`      | string                        | Default value is Current working dir (process.cwd()). This identifies the Application root folder     |
| `server`       | [Server](#serverConfig)       | This configure the application server details     |
| `routes`       | [Directory](#directoryConfig) | Optional. Default `{root}/definitions/routes/`. Provides the route definitions directory and file  configuration. |
| `services`     | [Directory](#directoryConfig) | Optional. Default `{root}/definitions/services/`. Provides the services definitions directory and file configuration. |

#### <a name="serverConfig"></a> Server configuration

|Options     | Type    |  Description                                     |
|------------|---------|-------------------------------------------------|
| `port`     | number  | Default 5000. Server port to listen. |
| `host`     | string  | Default undefined. Server host address to listen.     |

#### <a name="directoryConfig"></a> Directory configuration

|Options     | Type    |  Description                                     |
|------------|---------|-------------------------------------------------|
| `dir`        | string  | Directory path of configuration file. |
| `extension`  | string  | Extension of configuration file. e.g. .js, .route.json, .service.json etc    |