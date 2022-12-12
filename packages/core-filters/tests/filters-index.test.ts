import range from "../src/filter-value-parsers/range";
import switchFilter from '../src/filter-value-parsers/switch'
import { buildFindSelector } from "../src/module/configureFiltersModule";
import { defaultSelector, resolveAssortmentSelector } from "../src/search/resolveAssortmentSelector";
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

  
describe('range', () => {
  it('returns an empty array if no range is provided', () => {
    const values = [];
    const allKeys = [];
    const result = range(values, allKeys);
    expect(result).toEqual([]);
  });

  it('returns an array with the start value if no end value is provided', () => {
    const values = ['1'];
    const allKeys = ['1', '2', '3'];
    const result = range(values, allKeys);
    expect(result).toEqual(['1']);
  });

  it('returns an array with all keys within the range of start and end values', () => {
    const values = ['1:3'];
    const allKeys = ['1', '2', '3', '4'];
    const result = range(values, allKeys);
    expect(result).toEqual(['1', '2', '3']);
  });
});

describe('switch', () => {
  it('returns undefined if no value is provided', () => {
    const values = [];
    const result = switchFilter(values);
    expect(result).toEqual([undefined]);
  });

  it('returns true if a truthy value is provided', () => {
    const values = ['true'];
    const result = switchFilter(values);
    expect(result).toEqual(['true']);
  });

  it('returns false if a falsy value is provided', () => {
    const values = ['false'];
    const result = switchFilter(values);
    expect(result).toEqual(['false']);
  });
});

describe('defaultSelector', () => {
  it('returns an object with isActive key set to true if no query is provided', () => {
    const result = defaultSelector();
    expect(result).toEqual({isActive: true});
  });

  it('returns an object with the isActive property set to true if the includeInactive property is not provided or is false', () => {
    const result1 = defaultSelector({});
    expect(result1).toEqual({ isActive: true });

    const result2 = defaultSelector({ includeInactive: false });
    expect(result2).toEqual({ isActive: true });
  });

  it('returns an empty object if the includeInactive property is true', () => {
    const result = defaultSelector({ includeInactive: true });
    expect(result).toEqual({});
  });
});

describe('resolveAssortmentSelector', () => {
  it('returns an object with isActive key set to true if no query is provided', () => {
    const result = resolveAssortmentSelector();
    expect(result).toEqual({isActive: true});
  });

  it('returns an object with the isActive property set to true if the includeInactive property is not provided or is false', () => {
    const result1 = resolveAssortmentSelector({});
    expect(result1).toEqual({ isActive: true });

    const result2 = resolveAssortmentSelector({ includeInactive: false });
    expect(result2).toEqual({ isActive: true });
  });

  it('returns an empty object if the includeInactive property is true', () => {
    const result = resolveAssortmentSelector({ includeInactive: true });
    expect(result).toEqual({});
  });
});


  
});
