---
id: services-route-definition
title: Services in route definition
sidebar_label: Services
---

Services contains the list of services to be executed when the request identifies the route. Multiple, multi-level services can be defined for a single route.

If a route is selected for the execution, then the composit JS will select every service for the execution from the service discovery.

Sample `services` format:

```js
{
  "info": {
    ....
  },
  "definition": {
    ...
  },
  "services": [{
    "id": "service-01"
   },{
    "id": "service-02",
    "serviceName": "service-03"
  }],
  "output": {
    ...
  }
}
```

|Options        | Type    |  Description                                                                                     |
|---------------|---------|--------------------------------------------------------------------------------------------------|
| `id`          | string  | Required. `id` used as unique identifier of service in route-definition, and value of this will be name of service defined in service discovery. |
| `serviceName` | string   | Optinal. It have the name of the service defined in service discovery.|

**Note:**  If `serviceName` defined then the value of `id` will not consider for selecting service for execution. for e.g: Above sample route definition `serviceName` defined as `service-03` for the `service-02` ID. So, `service-03` will be executed and store with the name of `service-02`. 