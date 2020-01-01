---
id: getting-started
title: Getting started
sidebar_label: Getting started
---

### Prerequisites

Requires Node.js version 10.x or higher.

### Getting started

#### Step 1: 
Install the Composit JS locally by running:

```
npm install compositjs --save
```
#### Step 2:

Create index.js file, and paste below code:

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

#### Step 3:

Starting the application:

```
node index.js
```

Visit http://127.0.0.1:8001