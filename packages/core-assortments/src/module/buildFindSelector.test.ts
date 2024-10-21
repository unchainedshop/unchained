import { buildFindSelector } from './configureAssortmentsModule.js';

describe('buildFindSelector', () => {
  it('Return the correct filter when passed no argument', () => {
    expect(buildFindSelector({})).toEqual({ isRoot: true, isActive: true, deleted: null });
  });
  it('Return the correct filter when passed  queryString, assortmentId, assortmentSelector, includeInactive, includeLeaves, slugs, tags', () => {
    expect(
      buildFindSelector({
        queryString: 'hello world',
        assortmentIds: ['assortment-1', 'assortment-2'],
        assortmentSelector: { sequence: 1 },
        includeInactive: true,
        includeLeaves: true,
        slugs: ['assortment-slug-1', 'assortment-slug-2'],
        tags: ['assortment-tag'],
      }),
    ).toEqual({
      sequence: 1,
      _id: { $in: ['assortment-1', 'assortment-2'] },
      slugs: { $in: ['assortment-slug-1', 'assortment-slug-2'] },
      tags: { $all: ['assortment-tag'] },
      deleted: null,
      $text: { $search: 'hello world' },
    });
  });

  it('Return the correct filter when passed  queryString, assortmentId, assortmentSelector, includeInactive, includeLeaves, slugs', () => {
    expect(
      buildFindSelector({
        queryString: 'hello world',
        assortmentIds: ['assortment-1', 'assortment-2'],
        assortmentSelector: { sequence: 1 },
        includeInactive: true,
        includeLeaves: true,
        slugs: ['assortment-slug-1', 'assortment-slug-2'],
      }),
    ).toEqual({
      sequence: 1,
      deleted: null,

      _id: { $in: ['assortment-1', 'assortment-2'] },
      slugs: { $in: ['assortment-slug-1', 'assortment-slug-2'] },
      $text: { $search: 'hello world' },
    });
  });

  it('Return the correct filter when passed  queryString, assortmentId, assortmentSelector, includeInactive, includeLeaves', () => {
    expect(
      buildFindSelector({
        queryString: 'hello world',
        assortmentIds: ['assortment-1', 'assortment-2'],
        assortmentSelector: { sequence: 1 },
        includeInactive: true,
        includeLeaves: true,
      }),
    ).toEqual({
      sequence: 1,
      deleted: null,

      _id: { $in: ['assortment-1', 'assortment-2'] },
      $text: { $search: 'hello world' },
    });
  });

  it('Return the correct filter when passed  queryString, assortmentId, assortmentSelector, includeInactive', () => {
    expect(
      buildFindSelector({
        queryString: 'hello world',
        assortmentIds: ['assortment-1', 'assortment-2'],
        assortmentSelector: { sequence: 1 },
        includeInactive: true,
      }),
    ).toEqual({
      sequence: 1,
      deleted: null,

      _id: { $in: ['assortment-1', 'assortment-2'] },
      $text: { $search: 'hello world' },
    });
  });
  it('Return the correct filter when passed  queryString, assortmentId, assortmentSelector', () => {
    expect(
      buildFindSelector({
        queryString: 'hello world',
        assortmentIds: ['assortment-1', 'assortment-2'],
        assortmentSelector: { sequence: 1 },
      }),
    ).toEqual({
      sequence: 1,
      deleted: null,

      _id: { $in: ['assortment-1', 'assortment-2'] },
      $text: { $search: 'hello world' },
    });
  });

  it('Return the correct filter when passed  assortmentId, assortmentSelector', () => {
    expect(
      buildFindSelector({
        assortmentIds: ['assortment-1', 'assortment-2'],
        assortmentSelector: { sequence: 1 },
      }),
    ).toEqual({
      sequence: 1,
      deleted: null,

      _id: { $in: ['assortment-1', 'assortment-2'] },
    });
  });

  it('Return the correct filter when passed  assortmentSelector', () => {
    expect(buildFindSelector({ assortmentSelector: { sequence: 1 } })).toEqual({
      deleted: null,

      sequence: 1,
    });
  });
});
