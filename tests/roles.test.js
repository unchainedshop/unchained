// eslint-disable-next-line import/no-extraneous-dependencies
import { describe, test, expect } from '@jest/globals';
import { setupDatabase } from './helpers';
import { User } from './seeds/users';
import { isFunction, has } from '../packages/roles/helpers';
import { Roles } from '../packages/roles/index';

let connection;
let db;

describe('Roles', () => {
  beforeAll(async () => {
    // eslint-disable-next-line no-unused-vars
    [db, connection] = await setupDatabase();
  });

  afterEach(() => {
    Roles.roles = {};
    Roles.actions = [];
    Roles.helpers = [];
  });

  afterAll(async () => {
    await connection.close();
  });

  describe('Role utilities', () => {
    const testRole = new Roles.Role('test_role');
    const actionName = 'view_secret';

    it('should register an action rule', () => {
      const allowFn = () => true;
      testRole.allow(actionName, allowFn);
      expect(testRole.allowRules[actionName]).toEqual(
        expect.arrayContaining([allowFn]),
      );
    });

    it('it should register action rule', () => {
      const denyFn = () => false;
      testRole.deny(actionName, denyFn);
      expect(testRole.denyRules[actionName]).toEqual(
        expect.arrayContaining([denyFn]),
      );
    });

    it('should register a helper', () => {
      const helperFn = () => true;
      testRole.helper('test_helper', helperFn);
      expect(testRole.helpers.test_helper).toEqual(
        expect.arrayContaining([helperFn]),
      );
    });
  });

  describe('Attach and Retrieve Roles', () => {
    // it('should add roles to user document', async () => {
    //   const val = Roles.addUserToRoles(User._id, 'test_role');
    //   console.log('VAL: ', val);
    //   const { roles } = await db.collection('users').findOne({ _id: User._id });
    //   expect(roles).toEqual(expect.arrayContaining(['test_role']));
    // });
    // it('should get roles attach to user', () => {
    //   Roles.addUserToRoles(User._id, 'test_role');
    //   console.log('WWWWWWWWWWWWWW: ', Roles.getUserRoles(User._id));
    // });
  });

  describe('Role Helper Registration', () => {
    it('should add a helper', () => {
      Roles.registerHelper('test_helper');
      expect(Roles.helpers).toEqual(['test_helper']);
    });

    it('should add a helper attaching it to adminRole', () => {
      Roles.registerHelper('test_admin_helper', jest.fn());
      expect(Roles.helpers).toEqual(
        expect.arrayContaining(['test_admin_helper']),
      );
    });

    it('should skip adding helper if it already exists', () => {
      Roles.registerHelper('test_helper');
      Roles.registerHelper('test_admin_helper');

      expect(Roles.helpers).toEqual(
        expect.arrayContaining(['test_helper', 'test_admin_helper']),
      );
    });
  });

  // Roles.registerAction
  describe('Action registration', () => {
    it('should add an action', () => {
      Roles.registerAction('test_action');
      expect(Roles.actions).toEqual(['test_action']);
    });

    it('should skip adding action if it already exists', () => {
      Roles.registerAction('test_action');
      expect(Roles.actions).toEqual(['test_action']);
    });
  });

  // Roles.Role
  describe('Role contruction', () => {
    it('should construct a new role', () => {
      expect(new Roles.Role('test_role')).toMatchObject({
        name: 'test_role',
        allowRules: {},
        denyRules: {},
        helpers: {},
      });
    });

    it('should throw an error if given a role with similar name', () => {
      // eslint-disable-next-line no-new
      new Roles.Role('test_role');
      expect(() => new Roles.Role('test_role')).toThrow();
    });
  });

  describe('isFunction', () => {
    test('it should return true give a function', () => {
      expect(isFunction(function () {})).toBe(true);
    });

    test('it should return false given an improper function', () => {
      expect(isFunction('false')).toBe(false);
    });
  });

  describe('has', () => {
    test('it should return true for existent key', () => {
      const obj = {
        foo: 'bar',
      };
      expect(has(obj, 'foo')).toBe(true);
    });

    test('it should return true for existent nested key', () => {
      const obj = {
        foo: { bar: 'baz' },
      };
      expect(has(obj, 'foo.bar')).toBe(true);
    });

    test('it should return false for non existent', () => {
      const obj = {
        foo: 'bar',
      };
      expect(has(obj, 'baz')).toBe(false);
    });
  });
});
