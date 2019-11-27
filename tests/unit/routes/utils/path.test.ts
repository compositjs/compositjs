import { convertPathToRegexp } from '../../../../src/routes/utils/path';

describe('UnitTest::utils/path', () => {
  it('should return default, ', () => {
    expect(convertPathToRegexp()).toBeDefined();
  });
});
