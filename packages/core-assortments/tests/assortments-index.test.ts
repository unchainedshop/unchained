import { buildFindSelector } from "../src/module/configureAssortmentsModule";



describe('Assortment', () => {
  describe('buildFindSelector', () => {
    it('Return the correct filter when passed no argument', async () => {
      expect(buildFindSelector({})).toEqual({ isRoot: true, isActive: true })
    });
    it('Return the correct filter when passed  queryString, assortmentId, assortmentSelector, includeInactive, includeLeaves, slugs, tags', async () => {
    
      expect(buildFindSelector({queryString: "hello world", assortmentIds: ['assortment-1', 'assortment-2'], assortmentSelector: {sequence: 1}, includeInactive: true, includeLeaves: true, slugs: ['assortment-slug-1', 'assortment-slug-2'], tags: ['assortment-tag']})).toEqual( {
        sequence: 1,
        _id: { '$in': [ 'assortment-1', 'assortment-2' ] },
        slugs: { '$in': [ 'assortment-slug-1', 'assortment-slug-2' ] },
        tags: { '$all': [ 'assortment-tag' ] },
        '$text': { '$search': 'hello world' }
      }
  )
    });

    it('Return the correct filter when passed  queryString, assortmentId, assortmentSelector, includeInactive, includeLeaves, slugs', async () => {
    
      expect(buildFindSelector({queryString: "hello world", assortmentIds: ['assortment-1', 'assortment-2'], assortmentSelector: {sequence: 1}, includeInactive: true, includeLeaves: true, slugs: ['assortment-slug-1', 'assortment-slug-2']})).toEqual( {
        sequence: 1,
        _id: { '$in': [ 'assortment-1', 'assortment-2' ] },
        slugs: { '$in': [ 'assortment-slug-1', 'assortment-slug-2' ] },
        '$text': { '$search': 'hello world' }
      }
  )
    });

    it('Return the correct filter when passed  queryString, assortmentId, assortmentSelector, includeInactive, includeLeaves', async () => {
    
      expect(buildFindSelector({queryString: "hello world", assortmentIds: ['assortment-1', 'assortment-2'], assortmentSelector: {sequence: 1}, includeInactive: true, includeLeaves: true})).toEqual( {
        sequence: 1,
        _id: { '$in': [ 'assortment-1', 'assortment-2' ] },
        '$text': { '$search': 'hello world' }
      }
  )
    });

    it('Return the correct filter when passed  queryString, assortmentId, assortmentSelector, includeInactive', async () => {
    
      expect(buildFindSelector({queryString: "hello world", assortmentIds: ['assortment-1', 'assortment-2'], assortmentSelector: {sequence: 1}, includeInactive: true})).toEqual( {
        sequence: 1,
        _id: { '$in': [ 'assortment-1', 'assortment-2' ] },
        '$text': { '$search': 'hello world' },
      }
  )
    });
    it('Return the correct filter when passed  queryString, assortmentId, assortmentSelector', async () => {
    
      expect(buildFindSelector({queryString: "hello world", assortmentIds: ['assortment-1', 'assortment-2'], assortmentSelector: {sequence: 1}})).toEqual( {
        sequence: 1,
        _id: { '$in': [ 'assortment-1', 'assortment-2' ] },
        '$text': { '$search': 'hello world' },
      }
  )
    });

    it('Return the correct filter when passed  assortmentId, assortmentSelector', async () => {
      expect(buildFindSelector({ assortmentIds: ['assortment-1', 'assortment-2'], assortmentSelector: {sequence: 1}})).toEqual( {
        sequence: 1,
        _id: { '$in': [ 'assortment-1', 'assortment-2' ] },
      }
  )
    });

    it('Return the correct filter when passed  assortmentSelector', async () => {
      expect(buildFindSelector({ assortmentSelector: {sequence: 1}})).toEqual( {
        sequence: 1
      }
  )
    });
  })
  


});
