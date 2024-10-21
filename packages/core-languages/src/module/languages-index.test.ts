import { buildFindSelector } from './configureLanguagesModule.js';

describe('buildFindSelector', () => {
  it('Return correct filter object when passed no argument', () => {
    expect(buildFindSelector({})).toEqual({ deleted: null, isActive: true });
  });

  it('Return correct filter object includeInactive is set to true', () => {
    expect(buildFindSelector({ includeInactive: true })).toEqual({ deleted: null });
  });

  it('Return correct filter object when passed  includeInactive, queryString', () => {
    expect(buildFindSelector({ includeInactive: true, queryString: 'hello world' })).toEqual({
      deleted: null,
      $text: { $search: 'hello world' },
    });
  });

  it('Return correct filter object when passed queryString', () => {
    expect(buildFindSelector({ queryString: 'hello world' })).toEqual({
      deleted: null,
      isActive: true,
      $text: { $search: 'hello world' },
    });
  });
});
