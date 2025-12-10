import { describe, it } from 'node:test';
import { buildFindSelector } from './configureAssortmentsModule.ts';
import assert from 'node:assert';

describe('buildFindSelector', () => {
  it('Return the correct filter when passed no argument', () => {
    assert.deepStrictEqual(buildFindSelector({}), { isRoot: true, isActive: true, deleted: null });
  });
  it('Return the correct filter when passed  queryString, assortmentId, assortmentSelector, includeInactive, includeLeaves, slugs, tags', () => {
    assert.deepStrictEqual(
      buildFindSelector({
        queryString: 'hello world',
        assortmentIds: ['assortment-1', 'assortment-2'],
        assortmentSelector: { sequence: 1 },
        includeInactive: true,
        includeLeaves: true,
        slugs: ['assortment-slug-1', 'assortment-slug-2'],
        tags: ['assortment-tag'],
      }),
      {
        sequence: 1,
        _id: { $in: ['assortment-1', 'assortment-2'] },
        slugs: { $in: ['assortment-slug-1', 'assortment-slug-2'] },
        tags: { $all: ['assortment-tag'] },
        deleted: null,
        $text: { $search: 'hello world' },
      },
    );
  });

  it('Return the correct filter when passed  queryString, assortmentId, assortmentSelector, includeInactive, includeLeaves, slugs', () => {
    assert.deepStrictEqual(
      buildFindSelector({
        queryString: 'hello world',
        assortmentIds: ['assortment-1', 'assortment-2'],
        assortmentSelector: { sequence: 1 },
        includeInactive: true,
        includeLeaves: true,
        slugs: ['assortment-slug-1', 'assortment-slug-2'],
      }),
      {
        sequence: 1,
        deleted: null,

        _id: { $in: ['assortment-1', 'assortment-2'] },
        slugs: { $in: ['assortment-slug-1', 'assortment-slug-2'] },
        $text: { $search: 'hello world' },
      },
    );
  });

  it('Return the correct filter when passed  queryString, assortmentId, assortmentSelector, includeInactive, includeLeaves', () => {
    assert.deepStrictEqual(
      buildFindSelector({
        queryString: 'hello world',
        assortmentIds: ['assortment-1', 'assortment-2'],
        assortmentSelector: { sequence: 1 },
        includeInactive: true,
        includeLeaves: true,
      }),
      {
        sequence: 1,
        deleted: null,
        _id: { $in: ['assortment-1', 'assortment-2'] },
        $text: { $search: 'hello world' },
      },
    );
  });

  it('Return the correct filter when passed  queryString, assortmentId, assortmentSelector, includeInactive', () => {
    assert.deepStrictEqual(
      buildFindSelector({
        queryString: 'hello world',
        assortmentIds: ['assortment-1', 'assortment-2'],
        assortmentSelector: { sequence: 1 },
        includeInactive: true,
      }),
      {
        sequence: 1,
        deleted: null,
        _id: { $in: ['assortment-1', 'assortment-2'] },
        $text: { $search: 'hello world' },
      },
    );
  });
  it('Return the correct filter when passed  queryString, assortmentId, assortmentSelector', () => {
    assert.deepStrictEqual(
      buildFindSelector({
        queryString: 'hello world',
        assortmentIds: ['assortment-1', 'assortment-2'],
        assortmentSelector: { sequence: 1 },
      }),
      {
        sequence: 1,
        deleted: null,
        _id: { $in: ['assortment-1', 'assortment-2'] },
        $text: { $search: 'hello world' },
      },
    );
  });

  it('Return the correct filter when passed  assortmentId, assortmentSelector', () => {
    assert.deepStrictEqual(
      buildFindSelector({
        assortmentIds: ['assortment-1', 'assortment-2'],
        assortmentSelector: { sequence: 1 },
      }),
      {
        sequence: 1,
        deleted: null,
        _id: { $in: ['assortment-1', 'assortment-2'] },
      },
    );
  });

  it('Return the correct filter when passed  assortmentSelector', () => {
    assert.deepStrictEqual(buildFindSelector({ assortmentSelector: { sequence: 1 } }), {
      deleted: null,
      sequence: 1,
    });
  });
});
