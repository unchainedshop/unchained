
import {hashPassword} from "../src/module/utils/hashPassword"
import {dateProvider, idProvider} from "../src/accounts/dbManager"
import {evaluateContext} from "../src/module/utils/evaluateContext"
import {filterContext} from "../src/module/utils/filterContext"

describe('Accounts', () => {
    it('Should hash plain string sha256 and return a hex ', async () => {      
      expect(hashPassword('hello_world')).toEqual('35072c1ae546350e0bfa7ab11d49dc6f129e72ccd57ec7eb671225bbd197c8f1')
    });


    describe('idProvider', () => {
      it('should generate a string of length 17', () => {
        expect(idProvider()).toHaveLength(17);
      });
    
      it('should only contain alphanumeric characters', () => {
        expect(idProvider()).toMatch(/^[a-zA-Z0-9]+$/);
      });
      it('should generate a unique ID each time it is called', () => {
        const id1 = idProvider();
        const id2 = idProvider();
        expect(id1).not.toEqual(id2);
      });
    });


describe('dateProvider', () => {
  it('should return a Date object', () => {
    const date = dateProvider(null);
    expect(date).toBeInstanceOf(Date);
  });

  it('should return the provided date if passed as an argument', () => {
    const testDate = new Date(2022, 11, 9);
    const date = dateProvider(testDate);
    expect(date).toEqual(testDate);
  });
});

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

    expect(evaluateContext(filteredContext)).toEqual(expected);
  });
});


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


});
