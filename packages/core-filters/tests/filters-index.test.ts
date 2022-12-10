import range from "../src/filter-value-parsers/range";
import { buildFindSelector } from "../src/module/configureFiltersModule";
import { intersectSet } from "../src/utils/intersectSet";
import { parseQueryArray } from "../src/utils/parseQueryArray";

describe('Filters', () => {

  describe('buildFindSelector', () => {
    it('Return correct filter object when passed no argument', async () => {
      expect(buildFindSelector({})).toEqual({ isActive: true })
    });

    it('Return correct filter object when inactive is set to true', async () => {
      expect(buildFindSelector({includeInactive: true})).toEqual({  })
    });

    it('Return correct filter object when passed filterIds and queryString', async () => {
      expect(buildFindSelector({filterIds: ['filter-1', 'filter-2'], queryString: "Hello world"})).toEqual({
        isActive: true,
        _id: { '$in': [ 'filter-1', 'filter-2' ] },
        '$text': { '$search': 'Hello world' }
      })
    });

    it('Return correct filter object when passed filterIds', async () => {
      expect(buildFindSelector({filterIds: ['filter-1', 'filter-2']})).toEqual({
        isActive: true,
        _id: { '$in': [ 'filter-1', 'filter-2' ] },
        
      })
    });

    it('Return correct filter object when passed  queryString', async () => {
      expect(buildFindSelector({ queryString: "Hello world"})).toEqual({
        isActive: true,
        '$text': { '$search': 'Hello world' }
      })
    });

  })

  describe('intersectSet', () => {
    it('should return an empty set if the two input sets are empty', () => {
      const productIdSet: Set<string> = new Set();
      const filterProductIdSet: Set<string> = new Set();
      const result = intersectSet(productIdSet, filterProductIdSet);
      expect(result).toEqual(new Set());
    });
  
    it('should return an empty set if the two input sets do not have any common elements', () => {
      const productIdSet = new Set(['1', '2', '3']);
      const filterProductIdSet = new Set(['4', '5', '6']);
      const result = intersectSet(productIdSet, filterProductIdSet);
      expect(result).toEqual(new Set());
    });
  
    it('should return a set containing only the common elements of the two input sets', () => {
      const productIdSet = new Set(['1', '2', '3', '4']);
      const filterProductIdSet = new Set(['2', '3', '5', '6']);
      const result = intersectSet(productIdSet, filterProductIdSet);
      expect(result).toEqual(new Set(['2', '3']));
    });
  
    it('should not modify the original input sets', () => {
      const productIdSet = new Set(['1', '2', '3']);
      const filterProductIdSet = new Set(['2', '3', '4', '5']);
      intersectSet(productIdSet, filterProductIdSet);
      expect(productIdSet).toEqual(new Set(['1', '2', '3']));
      expect(filterProductIdSet).toEqual(new Set(['2', '3', '4', '5']));
    });
  });


describe('parseQueryArray', () => {
  it('parses empty array', () => {
    const query = [];
    const expected = {};
    const result = parseQueryArray(query);
    expect(result).toEqual(expected);
  });

  it('parses array with one key-value pair', () => {
    const query = [{ key: 'foo', value: 'bar' }];
    const expected = { foo: ['bar'] };
    const result = parseQueryArray(query);
    expect(result).toEqual(expected);
  });

  it('parses array with multiple key-value pairs', () => {
    const query = [      { key: 'foo', value: 'bar' },      { key: 'baz', value: 'qux' },    ];
    const expected = { foo: ['bar'], baz: ['qux'] };
    const result = parseQueryArray(query);
    expect(result).toEqual(expected);
  });

  it('parses array with multiple values for the same key', () => {
    const query = [      { key: 'foo', value: 'bar' },      { key: 'foo', value: 'baz' },    ];
    const expected = { foo: ['bar', 'baz'] };
    const result = parseQueryArray(query);
    expect(result).toEqual(expected);
  });
});

  
  
  
});
