import { buildFindSelector } from './configureCountriesModule.js';

describe('buildFindSelector', () => {
  it('should return correct filter object', () => {
    expect(buildFindSelector({ includeInactive: true, queryString: 'hello world' })).toEqual({
      deleted: null,
      $text: { $search: 'hello world' },
    });
    expect(buildFindSelector({ includeInactive: true })).toEqual({ deleted: null });
    expect(buildFindSelector({ queryString: 'hello world' })).toEqual({
      deleted: null,
      $text: { $search: 'hello world' },
      isActive: true,
    });
  });
});
