import { evaluateContext } from "./evaluateContext.js";

describe('evaluateContext', () => {
    it('should return the expected context user object', () => {
      const filteredContext = {
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
  
      const expected = {
        userIdBeforeLogin: '123',
        userBeforeLogin: {
          name: 'John Doe',
          email: 'johndoe@example.com',
        },
        normalizedLocale: 'en-US',
        otherField: 'foo',
      };
  
      expect(evaluateContext(filteredContext as any)).toEqual(expected);
    });
  });