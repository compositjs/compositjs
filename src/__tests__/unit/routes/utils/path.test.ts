import { convertPathToRegexp } from '../../../../routes/utils/path';

describe('UnitTest::utils/path', () => {
  it('should return default, ', () => {
    expect(convertPathToRegexp()).toBeDefined();
  });

  it('should return path regex without keys', () => {
    const regex = convertPathToRegexp('/test');
    expect(regex).toBeDefined();
    expect(regex.keys.length).toBe(0);
  });

  it('should return path regex with keys', () => {
    const regex = convertPathToRegexp('/test/:value');
    expect(regex).toBeDefined();
    expect(regex.keys).toEqual(expect.arrayContaining([
      expect.objectContaining({
        name: 'value'
      })
    ]));
  });

  it('should throw error wrong path pattern', () => {
    expect(() => {
      convertPathToRegexp('/test/(user|u)')
    }).toThrow();
  });
});
