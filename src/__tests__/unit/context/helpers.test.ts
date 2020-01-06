import { Context } from '@loopback/context';
import { getParamsFromContext } from '../../../context/helpers';

describe('UnitTest::context/helpers', () => {
  let context: Context;

  beforeAll(() => {
    context = new Context();
    context.bind('service.body').to('test')
  });

  it('should return value from context', () => {
    expect(getParamsFromContext('$.service.body', context)).toBe('test');
  });

  it('should return value from context, with object format', () => {
    const params = {
      data: {
        value: '$.service.body'
      }
    }
    expect(getParamsFromContext(params, context)).toMatchObject({ data: 'test' });
  });

  it('should return value from "default" param', () => {
    const params = {
      data: {
        value: '$.service.status',
        default: 'test-default'
      }
    }
    expect(getParamsFromContext(params, context)).toMatchObject({ data: 'test-default' });
  });

  it('should return value from "value" param', () => {
    const params = 'test-value'
    expect(getParamsFromContext(params, context)).toBe('test-value');
  });

  it('should return value from "value" param, with object format', () => {
    const params = {
      data: {
        value: 'test-value'
      }
    }
    expect(getParamsFromContext(params, context)).toMatchObject({ data: 'test-value' });
  });
});
