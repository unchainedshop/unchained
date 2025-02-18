import { describe, it } from 'node:test';
import assert from 'node:assert';
import { buildFindSelector } from './configureProductsModule';

describe('Product', () => {
  describe('buildFindSelector', () => {
    it('Return correct filter object object when no parameter is passed', () => {
      assert.deepStrictEqual(buildFindSelector({} as any), { status: { $eq: 'ACTIVE' } });
    });
    it('Return correct filter object object when passed includeDraft:true, productsIds, productSelector, queryString, slugs, tags ', () => {
      assert.deepStrictEqual(
        buildFindSelector({
          includeDrafts: true,
          productIds: ['product-1-id', 'product-id-2'],
          productSelector: { type: 'SIMPLE_PRODUCT' },
          queryString: 'hello world',
          slugs: ['slug-1', 'slug-2'],
          tags: ['tag-1', 'tag-2'],
        } as any),
        {
          type: 'SIMPLE_PRODUCT',
          _id: { $in: ['product-1-id', 'product-id-2'] },
          slugs: { $in: ['slug-1', 'slug-2'] },
          tags: { $all: ['tag-1', 'tag-2'] },
          $text: { $search: 'hello world' },
          status: { $in: ['ACTIVE', null] },
        },
      );
    });

    it('Return correct filter object object when passed includeDraft:true, productsIds, productSelector, queryString, slugs ', () => {
      assert.deepStrictEqual(
        buildFindSelector({
          includeDrafts: true,
          productIds: ['product-1-id', 'product-id-2'],
          productSelector: { type: 'SIMPLE_PRODUCT' },
          queryString: 'hello world',
          slugs: ['slug-1', 'slug-2'],
        } as any),
        {
          type: 'SIMPLE_PRODUCT',
          _id: { $in: ['product-1-id', 'product-id-2'] },
          slugs: { $in: ['slug-1', 'slug-2'] },
          $text: { $search: 'hello world' },
          status: { $in: ['ACTIVE', null] },
        },
      );
    });

    it('Return correct filter object object when passed includeDraft:true, productsIds, productSelector, queryString ', () => {
      assert.deepStrictEqual(
        buildFindSelector({
          includeDrafts: true,
          productIds: ['product-1-id', 'product-id-2'],
          productSelector: { type: 'SIMPLE_PRODUCT' },
          queryString: 'hello world',
        } as any),
        {
          type: 'SIMPLE_PRODUCT',
          _id: { $in: ['product-1-id', 'product-id-2'] },
          $text: { $search: 'hello world' },
          status: { $in: ['ACTIVE', null] },
        },
      );
    });

    it('Return correct filter object object when passed includeDraft:true, productsIds, productSelector ', () => {
      assert.deepStrictEqual(
        buildFindSelector({
          includeDrafts: true,
          productIds: ['product-1-id', 'product-id-2'],
          productSelector: { type: 'SIMPLE_PRODUCT' },
        } as any),
        {
          type: 'SIMPLE_PRODUCT',
          _id: { $in: ['product-1-id', 'product-id-2'] },
          status: { $in: ['ACTIVE', null] },
        },
      );
    });

    it('Return correct filter object object when passed includeDraft:true, productsIds ', () => {
      assert.deepStrictEqual(
        buildFindSelector({ includeDrafts: true, productIds: ['product-1-id', 'product-id-2'] } as any),
        {
          _id: { $in: ['product-1-id', 'product-id-2'] },
          status: { $in: ['ACTIVE', null] },
        },
      );
    });

    it('Return filter tags if passed as a string ', () => {
      assert.deepStrictEqual(buildFindSelector({ tags: 'string-tag' } as any), {
        tags: 'string-tag',
        status: { $eq: 'ACTIVE' },
      });
    });

    it('includeDrafts true  should add null to status filter array as null ', () => {
      assert.deepStrictEqual(buildFindSelector({ includeDrafts: true } as any), {
        status: { $in: ['ACTIVE', null] },
      });
    });
  });
});
