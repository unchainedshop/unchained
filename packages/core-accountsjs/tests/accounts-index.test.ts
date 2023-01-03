
import {hashPassword} from "../lib/module/utils/hashPassword.js"
import {buf2hex, toArrayBuffer } from "../lib/module/configureAccountsWebAuthnModule.js"
import {dateProvider, idProvider} from "../lib/accounts/dbManager.js"
import {evaluateContext} from "../lib/module/utils/evaluateContext.js"
import {filterContext} from "../lib/module/utils/filterContext.js"

describe('Accounts', () => {
    it('Should hash plain string sha256 and return a hex ', async () => {      
      expect(hashPassword('hello_world')).toEqual('35072c1ae546350e0bfa7ab11d49dc6f129e72ccd57ec7eb671225bbd197c8f1')
    });

    it('buf2hex should convert buffer to HEX', () => {
      expect(buf2hex(Buffer.from("hello"))).toEqual('68656c6c6f')
    })
    it('toArrayBuffer should return ArrayBuffer', () => {
      expect(toArrayBuffer(Buffer.from("hello"))).toBeInstanceOf(ArrayBuffer)
    })

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
    const filteredContext: any = {
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
    const graphqlContext: any = {
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

    const expected: any = {
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
