import { buildFindSelector } from "./configureEventsModule.js";

describe('Event', () => {
  describe('buildFindSelector', () => {
    it('Return correct filter object when passed create, queryString, types', () => {
    expect(buildFindSelector({created: new Date("2022-12-03T18:23:38.278Z"), queryString: "Hello world", types: ['PRODUCT_CREATED']})).toEqual({
        type: { '$in': [ 'PRODUCT_CREATED' ] },
        '$text': { '$search': 'Hello world' },
        created: { '$gte': new Date( "2022-12-03T18:23:38.278Z" )}
      })
    });

    it('Return correct filter object when passed create, queryString', () => {
      expect(buildFindSelector({created: new Date("2022-12-03T18:23:38.278Z"), queryString: "Hello world"})).toEqual({       
        '$text': { '$search': 'Hello world' },
        created: { '$gte': new Date( "2022-12-03T18:23:38.278Z" )}
      })
    });

    it('Return correct filter object when passed create', () => {
      expect(buildFindSelector({created: new Date("2022-12-03T18:23:38.278Z")})).toEqual({              
        created: { '$gte': new Date( "2022-12-03T18:23:38.278Z" )}
      })
    });

    it('Return correct filter object when passed no argument', () => {
      expect(buildFindSelector({})).toEqual({})
    });
  })
});
