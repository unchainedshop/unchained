import { buildFindSelector } from "./configureQuotationsModule.js";

describe('Quotation', () => {
  describe("buildFindSelector", () => {
    it('Return correct filter object when passed no argument', async () => {
      expect(buildFindSelector({})).toEqual({})
    });

    it('Return correct filter object when passed queryString and userId', async () => {
      expect(buildFindSelector({queryString: "hello world", userId: "admin-id"})).toEqual({ userId: 'admin-id', '$text': { '$search': 'hello world' } })
    });

    it('Return correct filter object when passed userId', async () => {
      expect(buildFindSelector({ userId: "admin-id"})).toEqual({ userId: 'admin-id' })
    });
    it('Return correct filter object when passed queryString', async () => {
      expect(buildFindSelector({queryString: "hello world"})).toEqual({  '$text': { '$search': 'hello world' } })
    });
  })
  
});
