---
id: output
title: Output
sidebar_label: Output
---

`output` define the response format after the execution of services in route definitions. It contains the information of output format and composit JS will respond to the client based on the configuration.

Sample `output` format:

```json
{
  "info": {
    ....
  },
  "definition": {
    ...
  },
  "services": [{
    ...,
  }],
  "output": {
    "strategy": "composit",
    "services": [
      "service-name",
    ]
  }
}
```

|Options     | Type    |  Description                                                                                     |
|------------|---------|--------------------------------------------------------------------------------------------------|
| `stategy`  | string  | Required. Define output strategy. Please [click here](#outputStrategies) more about strategies. |
| `services` | array   | Optinal. List of service names to be added with response.    |
| `headers`  | object  | Optinal. Response header information.    |
| `cookies`  | object  | Optinal. Define cookies and which will added to `set-cookie` option of header.    |


### <a name="outputStrategies"></a> Output Strategies

### standard

`standard` strategy will respond output of the service body.

e.g: 

```json
// route-definition
{
  "info": {
    ....
  },
  "definition": {
    ...
  },
  "services": [{
    "id": "service-01"
  }],
  "output": {
    "strategy": "standard",
    "service": "service-01"
  }
}
```

***Note:*** In `standard` strategy, `service` is mandatory.

#### composit

`composit` strategy will combine all the response of services to single JSON object.

e.g: 

```json
// route-definition
{
  "info": {
    ....
  },
  "definition": {
    ...
  },
  "services": [{
    "id": "service-01"
  }, {
    "id": "service-02"
  }],
  "output": {
    "strategy": "composit",
    "services": [
      "service-01",
      "service-02",
    ]
  }
}
```

for the above route-definition, response will be:

```json
{
  "service-name": {
    // response body of `service-01`
  },
  "service-name-02": {
    // response body of `service-02`
  }
}
```

#### redirect

`redirect` strategy for redirecting to another location. Which respond status as `302`.

**Note:** for `redirect` strategy header `location` must be there.

```json
// route-definition
{
  "info": {
    ....
  },
  "definition": {
    ...
  },
  "services": [],
  "output": {
    "strategy": "redirect",
    "headers": {
      "location": "http://www.google.com"
    }
  }
}
```
