import { buildFindSelector } from './configureProductsModule';

describe('Product', () => {
  describe('buildFindSelector', () => {
    it('Return correct filter object object when no parameter is passed', () => {
      expect(buildFindSelector({} as any)).toEqual({ status: { $eq: 'ACTIVE' } });
    });
    it('Return correct filter object object when passed includeDraft:true, productsIds, productSelector, queryString, slugs, tags ', () => {
      expect(
        buildFindSelector({
          includeDrafts: true,
          productIds: ['product-1-id', 'product-id-2'],
          productSelector: { type: 'SIMPLE_PRODUCT' },
          queryString: 'hello world',
          slugs: ['slug-1', 'slug-2'],
          tags: ['tag-1', 'tag-2'],
        } as any),
      ).toEqual({
        type: 'SIMPLE_PRODUCT',
        _id: { $in: ['product-1-id', 'product-id-2'] },
        slugs: { $in: ['slug-1', 'slug-2'] },
        tags: { $all: ['tag-1', 'tag-2'] },
        $text: { $search: 'hello world' },
        status: { $in: ['ACTIVE', null] },
      });
    });

    it('Return correct filter object object when passed includeDraft:true, productsIds, productSelector, queryString, slugs ', () => {
      expect(
        buildFindSelector({
          includeDrafts: true,
          productIds: ['product-1-id', 'product-id-2'],
          productSelector: { type: 'SIMPLE_PRODUCT' },
          queryString: 'hello world',
          slugs: ['slug-1', 'slug-2'],
        } as any),
      ).toEqual({
        type: 'SIMPLE_PRODUCT',
        _id: { $in: ['product-1-id', 'product-id-2'] },
        slugs: { $in: ['slug-1', 'slug-2'] },
        $text: { $search: 'hello world' },
        status: { $in: ['ACTIVE', null] },
      });
    });

    it('Return correct filter object object when passed includeDraft:true, productsIds, productSelector, queryString ', () => {
      expect(
        buildFindSelector({
          includeDrafts: true,
          productIds: ['product-1-id', 'product-id-2'],
          productSelector: { type: 'SIMPLE_PRODUCT' },
          queryString: 'hello world',
        } as any),
      ).toEqual({
        type: 'SIMPLE_PRODUCT',
        _id: { $in: ['product-1-id', 'product-id-2'] },
        $text: { $search: 'hello world' },
        status: { $in: ['ACTIVE', null] },
      });
    });

    it('Return correct filter object object when passed includeDraft:true, productsIds, productSelector ', () => {
      expect(
        buildFindSelector({
          includeDrafts: true,
          productIds: ['product-1-id', 'product-id-2'],
          productSelector: { type: 'SIMPLE_PRODUCT' },
        } as any),
      ).toEqual({
        type: 'SIMPLE_PRODUCT',
        _id: { $in: ['product-1-id', 'product-id-2'] },
        status: { $in: ['ACTIVE', null] },
      });
    });

    it('Return correct filter object object when passed includeDraft:true, productsIds ', () => {
      expect(
        buildFindSelector({ includeDrafts: true, productIds: ['product-1-id', 'product-id-2'] } as any),
      ).toEqual({
        _id: { $in: ['product-1-id', 'product-id-2'] },
        status: { $in: ['ACTIVE', null] },
      });
    });

    it('Return filter tags if passed as a string ', () => {
      expect(buildFindSelector({ tags: 'string-tag' } as any)).toEqual({
        tags: 'string-tag',
        status: { $eq: 'ACTIVE' },
      });
    });

    it('includeDrafts true  should add null to status filter array as null ', () => {
      expect(buildFindSelector({ includeDrafts: true } as any)).toEqual({
        status: { $in: ['ACTIVE', null] },
      });
    });
  });
});
