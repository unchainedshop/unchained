import { buildFindSelector } from "../src/module/configureLanguagesModule";

describe('Languages', () => {
  describe('buildFindSelector', () => {
    it('Return correct filter object when passed no argument', async () => {
      expect(buildFindSelector({})).toEqual({ deleted: null, isActive: true })
    });

    it('Return correct filter object includeInactive is set to true', async () => {
      expect(buildFindSelector({includeInactive: true})).toEqual({ deleted: null })
    });

    it('Return correct filter object isBase is set to true', async () => {
      expect(buildFindSelector({isBase: true})).toEqual({ deleted: null, isActive: true, isBase: true })
    });

    it('Return correct filter object when passed isBase, includeInactive, queryString', async () => {
      expect(buildFindSelector({isBase: true, includeInactive: true,queryString: "hello world"})).toEqual({ deleted: null, isBase: true, '$text': { '$search': 'hello world' } })
    });

    it('Return correct filter object when passed  includeInactive, queryString', async () => {
      expect(buildFindSelector({ includeInactive: true,queryString: "hello world"})).toEqual({ deleted: null, '$text': { '$search': 'hello world' } })
    });

    it('Return correct filter object when passed queryString', async () => {
      expect(buildFindSelector({ queryString: "hello world"})).toEqual({ deleted: null, isActive: true, '$text': { '$search': 'hello world' } })
    });

  })
  
});
