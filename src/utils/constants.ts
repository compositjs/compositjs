
export namespace ApplicationBindings {
  export const CONFIG = 'application.config';
  export const MIDDLEWARES = 'application.middlewares';
  export const INSTANCE = 'application.instance';
}

export namespace RouteBindings {
  export const ROUTE_OUTPUT = 'route.output'
}

export namespace RequestBindings {
  export const REQUEST_PARAMS = 'request.params'
  export const REQUEST_TAG_NAME = 'request'
}

export namespace ServiceBindings {
  export const SERVICE_TAG_NAME = 'service'
  export const SERVICE_PRE_ACTION_KEY = (serviceId: string) => `${serviceId}.action.pre`
  export const SERVICE_POST_ACTION_KEY = (serviceId: string) => `${serviceId}.action.post`
}


export const CONTEXT_PREFIX = '$.';
