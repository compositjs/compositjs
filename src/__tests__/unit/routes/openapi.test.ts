import openAPIParameterResolver from '../../../routes/openapi';

describe('UnitTest::utils/path', () => {
  const parameters: any = [{
    "name": "code",
    "in": "query",
    "schema": {
      "type": "string"
    },
    "required": true,
    "description": ""
  },{
    "name": "state",
    "in": "query",
    "schema": {
      "type": "string"
    },
    "required": true,
    "description": "JWT Token"
  }];

  it('should return true, as all request parameters are in request object', () => {
    const request = {
      query: {
        state: 'test',
        code: 'test'
      },
      params: {},
    };
    const error = openAPIParameterResolver(parameters, request); 

    expect(error).toBe(true);
  });

  it('should return false as "code" parameter is missing from request object', () => {
    const request = {
      query: {
        state: 'test'
      },
      params: {},
    };
    const error = openAPIParameterResolver(parameters, request); 

    expect(error).toBe(false);
  });

  it('should return true as "code" parameter have default value even missing from request object', () => {
    parameters[0] = {
      ...parameters[0],
      default: 'test'
    } 
    const request = {
      query: {
        state: 'test'
      },
      params: {},
    };
    const error = openAPIParameterResolver(parameters, request); 

    expect(error).toBe(true);
  });
});
