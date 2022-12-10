import { Tree } from "@unchainedshop/types/common";
import { buildFindSelector } from "../src/module/configureAssortmentsModule";
import { divideTreeByLevels, concatItemsByLevels, fillToSameLengthArray, fillUp } from "../src/utils/tree-zipper/zipTreeByDeepness";



describe('Assortment', () => {
  describe('buildFindSelector', () => {
    it('Return the correct filter when passed no argument', async () => {
      expect(buildFindSelector({})).toEqual({ isRoot: true, isActive: true,         "deleted": null,    })
    });
    it('Return the correct filter when passed  queryString, assortmentId, assortmentSelector, includeInactive, includeLeaves, slugs, tags', async () => {
    
      expect(buildFindSelector({queryString: "hello world", assortmentIds: ['assortment-1', 'assortment-2'], assortmentSelector: {sequence: 1}, includeInactive: true, includeLeaves: true, slugs: ['assortment-slug-1', 'assortment-slug-2'], tags: ['assortment-tag']})).toEqual( {
        sequence: 1,
        _id: { '$in': [ 'assortment-1', 'assortment-2' ] },
        slugs: { '$in': [ 'assortment-slug-1', 'assortment-slug-2' ] },
        tags: { '$all': [ 'assortment-tag' ] },
        "deleted": null,
        '$text': { '$search': 'hello world' }
      }
  )
    });

    it('Return the correct filter when passed  queryString, assortmentId, assortmentSelector, includeInactive, includeLeaves, slugs', async () => {
    
      expect(buildFindSelector({queryString: "hello world", assortmentIds: ['assortment-1', 'assortment-2'], assortmentSelector: {sequence: 1}, includeInactive: true, includeLeaves: true, slugs: ['assortment-slug-1', 'assortment-slug-2']})).toEqual( {
        sequence: 1,
        "deleted": null,

        _id: { '$in': [ 'assortment-1', 'assortment-2' ] },
        slugs: { '$in': [ 'assortment-slug-1', 'assortment-slug-2' ] },
        '$text': { '$search': 'hello world' }
      }
  )
    });

    it('Return the correct filter when passed  queryString, assortmentId, assortmentSelector, includeInactive, includeLeaves', async () => {
    
      expect(buildFindSelector({queryString: "hello world", assortmentIds: ['assortment-1', 'assortment-2'], assortmentSelector: {sequence: 1}, includeInactive: true, includeLeaves: true})).toEqual( {
        sequence: 1,
        "deleted": null,

        _id: { '$in': [ 'assortment-1', 'assortment-2' ] },
        '$text': { '$search': 'hello world' }
      }
  )
    });

    it('Return the correct filter when passed  queryString, assortmentId, assortmentSelector, includeInactive', async () => {
    
      expect(buildFindSelector({queryString: "hello world", assortmentIds: ['assortment-1', 'assortment-2'], assortmentSelector: {sequence: 1}, includeInactive: true})).toEqual( {
        sequence: 1,
        "deleted": null,

        _id: { '$in': [ 'assortment-1', 'assortment-2' ] },
        '$text': { '$search': 'hello world' },
      }
  )
    });
    it('Return the correct filter when passed  queryString, assortmentId, assortmentSelector', async () => {
    
      expect(buildFindSelector({queryString: "hello world", assortmentIds: ['assortment-1', 'assortment-2'], assortmentSelector: {sequence: 1}})).toEqual( {
        sequence: 1,
        "deleted": null,

        _id: { '$in': [ 'assortment-1', 'assortment-2' ] },
        '$text': { '$search': 'hello world' },
      }
  )
    });

    it('Return the correct filter when passed  assortmentId, assortmentSelector', async () => {
      expect(buildFindSelector({ assortmentIds: ['assortment-1', 'assortment-2'], assortmentSelector: {sequence: 1}})).toEqual( {
        sequence: 1,
        "deleted": null,

        _id: { '$in': [ 'assortment-1', 'assortment-2' ] },
      }
  )
    });

    it('Return the correct filter when passed  assortmentSelector', async () => {
      expect(buildFindSelector({ assortmentSelector: {sequence: 1}})).toEqual( {
        "deleted": null,

        sequence: 1
      }
  )
    });
  })
  
  

describe('divideTreeByLevels', () => {
  it('should return the expected result', () => {
    const array: Tree<string> = [
      'a',
      [
        'b',
        [
          'c',
          'd',
        ],
      ],
      'e',
    ];
    const expected = [
      {
        level: 0,
        items: ['a', 'e'],
      },
      {
        level: 1,
        items: ['b'],
      },
      {
        level: 2,
        items: ['c', 'd'],
      },
    ];

    expect(divideTreeByLevels(array)).toEqual(expected);
  });
});


describe('fillUp', () => {
  it('should fill empty spaces with null based on the passed size parameter', () => {
    const arr = [1, 2, 3];
    const size = 5;
  
    const result = fillUp(arr, size);
  
    expect(result).toEqual([1, 2, 3, null, null]);

  })
  
});

describe('fillToSameLengthArray', () => {
  it('should fill missing value place with null', () => {
  const a = [1, 2, 3];
  const b = [4, 5];

  const result = fillToSameLengthArray(a, b);

  expect(result).toEqual([[1, 2, 3], [4, 5, null]]);
})
});

test('concatItemsByLevels', () => {
  const levelArray = [    { level: 1, items: ['a', 'b'] },
    { level: 2, items: ['c', 'd'] },
    { level: 1, items: ['e', 'f'] },
  ];
  const result = concatItemsByLevels(levelArray);
  expect(result.length).toBe(2);
  
});


});
