import { describe, it } from 'node:test';
import assert from 'node:assert';
import { filtersSettings } from '@unchainedshop/core-filters';
import { FilterDirector, parseQueryArray } from './FilterDirector.ts';

describe('FilterDirector', () => {
  describe('parseQueryArray', () => {
    it('should return empty object for undefined', () => {
      assert.deepStrictEqual(parseQueryArray(undefined), {});
    });

    it('should return empty object for empty array', () => {
      assert.deepStrictEqual(parseQueryArray([]), {});
    });

    it('should parse single key-value pair', () => {
      const result = parseQueryArray([{ key: 'color', value: 'red' }]);
      assert.deepStrictEqual(result, { color: ['red'] });
    });

    it('should concatenate values for same key', () => {
      const result = parseQueryArray([
        { key: 'color', value: 'red' },
        { key: 'color', value: 'blue' },
      ]);
      assert.deepStrictEqual(result, { color: ['red', 'blue'] });
    });

    it('should handle multiple different keys', () => {
      const result = parseQueryArray([
        { key: 'color', value: 'red' },
        { key: 'size', value: 'large' },
      ]);
      assert.deepStrictEqual(result, { color: ['red'], size: ['large'] });
    });
  });

  describe('productFacetedSearch', () => {
    const hitsByRelevance = ['p5', 'p3', 'p9', 'p1', 'p7'];

    const facetedSearch = (
      productIdMaps: Record<string, Record<string, string[]>>,
      filterQuery: { key: string; value: string }[],
      strictFilterQuery?: boolean,
    ) => {
      const director = {
        ...FilterDirector,
        buildProductIdMap: async (filter) => {
          const productIdMap = productIdMaps[filter.key];
          return [Object.values(productIdMap).flat(), productIdMap];
        },
      };
      const modules = {
        filters: {
          findFilters: async () => Object.keys(productIdMaps).map((key) => ({ _id: key, key })),
          parse: (filter, values) => values,
        },
      };
      return director.productFacetedSearch(
        hitsByRelevance,
        {
          searchQuery: { filterQuery, strictFilterQuery },
          filterSelector: {},
          forceLiveCollection: true,
        } as any,
        { modules } as any,
      );
    };

    it('should keep the input order when a filter matches fewer products than the input', async () => {
      const result = await facetedSearch({ brand: { nike: ['p1', 'p3', 'p5'] } }, [
        { key: 'brand', value: 'nike' },
      ]);
      assert.deepStrictEqual(result, ['p5', 'p3', 'p1']);
    });

    it('should keep the input order across several filters and values', async () => {
      const result = await facetedSearch(
        {
          brand: { nike: ['p1', 'p5'], adidas: ['p3', 'p8'] },
          color: { red: ['p1', 'p3', 'p5', 'p7'] },
        },
        [
          { key: 'brand', value: 'nike' },
          { key: 'brand', value: 'adidas' },
          { key: 'color', value: 'red' },
        ],
      );
      assert.deepStrictEqual(result, ['p5', 'p3', 'p1']);
    });

    it('should ignore a key without an applicable filter unless the query is strict', async () => {
      const productIdMaps = { brand: { nike: ['p1', 'p3', 'p5'] } };
      const filterQuery = [{ key: 'price', value: '0:5000' }];
      assert.deepStrictEqual(await facetedSearch(productIdMaps, filterQuery), hitsByRelevance);
      await assert.rejects(facetedSearch(productIdMaps, filterQuery, true), {
        cause: 'FILTER_NOT_APPLICABLE',
      });
    });
  });

  describe('productFacetedSearch from cached memberships', () => {
    const hitsByRelevance = ['p5', 'p3', 'p9', 'p1', 'p7'];
    const memberships: Record<string, [string[], Record<string, string[]>]> = {
      brand: [['p1', 'p3', 'p5', 'p8'], { nike: ['p1', 'p5'], adidas: ['p3', 'p8'], puma: [] }],
      color: [['p1', 'p3', 'p5', 'p7'], { red: ['p1', 'p3', 'p5', 'p7'] }],
      size: [['p9'], { xl: ['p9'] }],
    };
    const modules = {
      filters: {
        findFilters: async () => Object.keys(memberships).map((key) => ({ _id: key, key })),
        parse: (filter, values) => values,
      },
    };
    const facetedSearch = (filterQuery: { key: string; value: string }[]) =>
      FilterDirector.productFacetedSearch(
        hitsByRelevance,
        { searchQuery: { filterQuery }, filterSelector: {}, forceLiveCollection: false } as any,
        { modules } as any,
      );

    it('requests every selected filter before the first answers, so a cache can batch them', async (t) => {
      const requested: string[] = [];
      const answers: (() => void)[] = [];
      t.mock.method(
        filtersSettings,
        'getCachedProductIds',
        (filterId: string) =>
          new Promise((resolve) => {
            requested.push(filterId);
            answers.push(() => resolve(memberships[filterId]));
          }),
      );
      const result = facetedSearch([
        { key: 'brand', value: 'nike' },
        { key: 'brand', value: 'adidas' },
        { key: 'color', value: 'red' },
      ]);

      await new Promise((resolve) => setImmediate(resolve));
      assert.deepStrictEqual(requested, ['brand', 'color']);
      for (const answer of answers) answer();
      assert.deepStrictEqual(await result, ['p5', 'p3', 'p1']);
    });

    it('matches nothing for a value without products and ignores selections without a filter', async (t) => {
      t.mock.method(
        filtersSettings,
        'getCachedProductIds',
        async (filterId: string) => memberships[filterId],
      );
      assert.deepStrictEqual(await facetedSearch([{ key: 'brand', value: 'puma' }]), []);
      assert.deepStrictEqual(await facetedSearch([{ key: 'material', value: 'wool' }]), hitsByRelevance);
    });
  });
});
