---
id: output
title: Output
sidebar_label: Output
---

Output define response after the execution of services in route definitions. It contains the information of output format and composit JS will respond to the client based on the configuration.

Sample `output` format:

```js
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
| `stategy`  | string  | Required. Define output strategy. Please [click here]](#outputStrategies) more about strategies. |
| `services` | array   | Optinal. List of service names.    |
| `headers`  | object  | Optinal. Response header information.    |
| `cookies`  | object  | Optinal. Define cookies and which will added to `set-cookie` option of header.    |


### <a name="outputStrategies"></a> Output Strategies

#### composit

`composit` strategy will combine all the response of services to single JSON object.

e.g: 

```js
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

```js
{
  "service-name": {
    // response body of `service-01`
  },
  "service-name-02": {
    // response body of `service-01`
  }
}
```

#### redirect

`redirect` strategy for redirecting to another location. Which respond status as `302`.

**Note:** for `redirect` strategy header `location` must be there.

```js
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
