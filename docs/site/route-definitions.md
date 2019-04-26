---
id: route-definitions
title: Routes definitions
sidebar_label: Routes definitions
---

Route definitions are the entry point for all requests to the Composit JS. 

Definitions should define in JSON format and save file inside `/definitions/routes` from root folder of the application and file should have extension of `.route.json`. 

`e.g /definitions/routes/sample.route.json`

Composit JS will read and initialize the routes when the application booting phase. You can able to configure the file extension and directory path of route definitions through application configuration.

```js

const config = {
  ...,
  ...,
  routes: {
    dir: __dirname + '/definitions/routes/',
    extension: '.route.json'
  },
  ...
};

const application = new Application(config);

await application.start();

```

For more information about the application configuration, please read [here](application-config.md).

Route definitons should have below four sections:

- info
- definition
- services
- output

## info

In this section, contains basic information about the route. Name, description etc... These informations are using for swagger documentation and storing route artifacts to the application when booting.

## definition

In this section, contains the information for endpoint request e.g. host, path etc... Composit JS identifies the request through these information when its get a request.

## services

In this section, contains the information of services to be executed when the request identifies this route. Multiple services can be defined in single route and composit JS support multi-level services also.

## output

In this section, contains the information of output format from the route. Once all services executed, composit JS will respond to the client based on the information from output section.