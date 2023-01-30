import { filterContext } from "./filterContext.js";

describe('filterContext', () => {
    it('should return the expected use object with EXCLUDED_CONTEXT_FIELDS removed', () => {
      const graphqlContext = {
        userId: '123',
        user: {
          name: 'John Doe',
          email: 'johndoe@example.com',
        },
        localeContext: {
          normalized: 'en-US',
        },
        otherField: 'foo',
        modules: {},
        services: {},
        bulkImporter: {},
        loaders: {},
        req: {},
        res: {},
        _privateField: 'bar',
      };
  
      const expected = {
        userId: '123',
        user: {
          name: 'John Doe',
          email: 'johndoe@example.com',
        },
        localeContext: {
          normalized: 'en-US',
        },
        otherField: 'foo',
      };
  
      expect(filterContext(graphqlContext)).toEqual(expected);
    });
  });
  