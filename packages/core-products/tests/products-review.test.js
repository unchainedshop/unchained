import {buildFindSelector} from "../lib/module/configureProductReviewsModule"
describe('Product Review', () => {
  describe("buildFindSelector", () => {
    it('Return correct filter object object when no parameter is passed', async () => {
      expect(buildFindSelector({})).toEqual({deleted: null})
    })

    it('Return correct filter object object when passed authorId, productId, queryString & updated', async () => {
      expect(buildFindSelector({authorId: "admin-id", productId: "product-id", queryString: "hello world", updated: {start: new Date("2022-12-04T14:54:51.184Z"), end: new Date("2022-12-04T14:54:51.184Z")}})).toEqual( {
        productId: 'product-id',
        authorId: 'admin-id',
        deleted: null,
        '$text': { '$search': 'hello world' },
        
        updated: {
          '$gte': new Date("2022-12-04T14:54:51.184Z"),
          '$lte': new Date("2022-12-04T14:54:51.184Z")
        }
      })
    });

    it('Return correct filter object object when passed authorId, productId & queryString ', async () => {
      expect(buildFindSelector({authorId: "admin-id", productId: "product-id", queryString: "hello world",})).toEqual( {
        productId: 'product-id',
        authorId: 'admin-id',
        deleted: null,
        '$text': { '$search': 'hello world' },
      })
    });

    it('Return correct filter object object when passed authorId &  productId ', async () => {
      expect(buildFindSelector({authorId: "admin-id", productId: "product-id"})).toEqual( {
        productId: 'product-id',
        authorId: 'admin-id',
        deleted: null,
      })
    });

    it('Return correct filter object object when passed authorId ', async () => {
      expect(buildFindSelector({authorId: "admin-id"})).toEqual( {
        authorId: 'admin-id',
        deleted: null,
      })
    });

    it('Set created date filter to unix start time if created.start is not provided  ', async () => {
      expect(buildFindSelector({created: { end: new Date("2022-12-04T14:54:51.184Z")}})).toEqual({
        deleted: null,
        created: {
          '$gte': new Date(0),
          '$lte': new Date("2022-12-04T14:54:51.184Z")
        }
      })
    });

    it('Set updated date filter to unix start time if updated.start is not provided  ', async () => {
      expect(buildFindSelector({updated: { end: new Date("2022-12-04T14:54:51.184Z")}})).toEqual({
        deleted: null,
        updated: {
          '$gte': new Date(0),
          '$lte': new Date("2022-12-04T14:54:51.184Z")
        }
      })
    });

    it('Should filter created date greater that provided when created.end is not provided', async () => {      
      expect(buildFindSelector({created: { start: new Date("2022-12-04T14:54:51.184Z")}})).toEqual({ deleted: null, created: { '$gte': new Date("2022-12-04T14:54:51.184Z") } })
    });

    it('Should filter updated date greater that provided when updated.end is not provided', async () => {      
      expect(buildFindSelector({updated: { start: new Date("2022-12-04T14:54:51.184Z")}})).toEqual({ deleted: null, updated: { '$gte': new Date("2022-12-04T14:54:51.184Z") } })
    });
  })
});
