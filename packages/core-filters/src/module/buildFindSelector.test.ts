import { buildFindSelector } from "./configureFiltersModule.js";

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
