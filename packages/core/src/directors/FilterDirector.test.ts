import { describe, it } from 'node:test';
import assert from 'node:assert';
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
    // What a text search adapter hands over: its hits, best match first.
    const hitsByRelevance = ['p5', 'p3', 'p9', 'p1', 'p7'];

    const facetedSearch = (
      productIdMaps: Record<string, Record<string, string[]>>,
      filterQuery: { key: string; value: string }[],
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
        { searchQuery: { filterQuery }, filterSelector: {}, forceLiveCollection: true } as any,
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
  });
});
