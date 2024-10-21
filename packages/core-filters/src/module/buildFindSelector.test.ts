import { buildFindSelector } from './configureFiltersModule.js';

describe('buildFindSelector', () => {
  it('Return correct filter object when passed no argument', () => {
    expect(buildFindSelector({})).toEqual({ isActive: true });
  });

  it('Return correct filter object when inactive is set to true', () => {
    expect(buildFindSelector({ includeInactive: true })).toEqual({});
  });

  it('Return correct filter object when passed filterIds and queryString', () => {
    expect(
      buildFindSelector({ filterIds: ['filter-1', 'filter-2'], queryString: 'Hello world' }),
    ).toEqual({
      isActive: true,
      _id: { $in: ['filter-1', 'filter-2'] },
      $text: { $search: 'Hello world' },
    });
  });

  it('Return correct filter object when passed filterIds', () => {
    expect(buildFindSelector({ filterIds: ['filter-1', 'filter-2'] })).toEqual({
      isActive: true,
      _id: { $in: ['filter-1', 'filter-2'] },
    });
  });

  it('Return correct filter object when passed  queryString', () => {
    expect(buildFindSelector({ queryString: 'Hello world' })).toEqual({
      isActive: true,
      $text: { $search: 'Hello world' },
    });
  });
});
