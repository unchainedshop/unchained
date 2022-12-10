describe('Roles', () => {
  it('Init', async () => {
    expect(true).toBeTruthy()
  });
});


import {
  describe,
  test,
  expect,
  it,
  beforeAll,
  afterEach,
  jest,
} from '@jest/globals';

import { Role, Roles, isFunction, has, permissions } from '../src/roles-index';

describe('Roles', () => {
  beforeAll(async () => {
    
  });

  afterEach(() => {
    Roles.roles = {};
    Roles.actions = [];
    Roles.helpers = [];
  });

  describe('Role utilities', () => {
   /*  const testRole = new Role('test_role');
    const actionName = 'view_secret';

    it('should register an action rule', () => {
      const allowFn = () => true;
      testRole.allow(actionName, allowFn);
      expect(testRole.allowRules[actionName]).toEqual(
        expect.arrayContaining([allowFn])
      );
    });

    it('should register a helper', () => {
      const helperFn = () => true;
      testRole.helper('test_helper', helperFn);
      expect(testRole.helpers.test_helper).toEqual(
        expect.arrayContaining([helperFn])
      );
    });

    it('should return true if the user passes the allow check', () => {
      const permissionTestRole = new Role('permission_test_role');
      permissionTestRole.allow('view_data', () => true);

      expect(Roles.allow('permission_user', 'view_data', '', {})).toBe(true);
    });

    it("should return false if the user doesn't pass the allow check", () => {
      const permissionTestRole = new Role('permission_test_role');
      permissionTestRole.allow('view_data', () => false);

      expect(Roles.allow('permission_user', 'view_data')).toBe(false);
    });

    it('should return false given a false user id', () => {
      const permissionTestRole = new Role('permission_test_role');
      permissionTestRole.allow('view_data', () => false);

      expect(Roles.allow('not_found_user', 'view_data')).toBe(false);
    });

    it('should return false given a false role', () => {
      expect(Roles.allow('permission_user', 'view_data')).toBe(false);
    });
  });

  describe('Add allow to role', () => {
    it('allow', async () => {
      const permissionTestRole = new Role('permission_test_role');
      permissionTestRole.allow('view_data', () => true);

      expect(Roles.userHasPermission('permission_user', 'view_data')).toBe(
        true
      );
    });
  }); */
/* 
  describe('Retrieve Roles', () => {
    it('should add roles to user document', async () => {
      const result = Roles.addUserToRoles(User._id, 'test_role');
      expect(result).toMatchObject({ ok: 1, nModified: 1, n: 1 });
    });

    it('should get roles attach to user', () => {
      const roles = Roles.getUserRoles(User._id);
      expect(roles).toEqual(expect.arrayContaining(['test_role']));
    });

    it('should get roles including special ones', () => {
      const roles = Roles.getUserRoles(User._id, true);
      expect(roles).toEqual(
        expect.arrayContaining([
          'test_role',
          '__all__',
          '__loggedIn__',
          '__notAdmin__',
        ])
      );
    });

    it('should get admin user roles including special ones', () => {
      const roles = Roles.getUserRoles('admin', true);
      expect(roles).toEqual(
        expect.arrayContaining([
          'test_role',
          'admin',
          '__all__',
          '__loggedIn__',
        ])
      );
    });

    it('should get roles including special ones as not logged in user', () => {
      const roles = Roles.getUserRoles(null, true);
      expect(roles).toEqual(
        expect.arrayContaining(['__all__', '__notLoggedIn__'])
      );
    });
  });
 */
  describe('Role Helper Registration', () => {
    it('should add a helper', () => {
      Roles.registerHelper('test_helper');
      expect(Roles.helpers).toEqual(['test_helper']);
    });

/*     it('should add a helper attaching it to adminRole', () => {
      Roles.registerHelper('test_admin_helper', jest.fn());
      expect(Roles.helpers).toEqual(
        expect.arrayContaining(['test_admin_helper'])
      );
    }); */

    it('should skip adding helper if it already exists', () => {
      Roles.registerHelper('test_helper');
      Roles.registerHelper('test_admin_helper');

      expect(Roles.helpers).toEqual(
        expect.arrayContaining(['test_helper', 'test_admin_helper'])
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
      expect(new Role('test_role')).toMatchObject({
        name: 'test_role',
        allowRules: {},
        helpers: {},
      });
    });

    it('should throw an error if given a role with similar name', () => {
      // eslint-disable-next-line no-new
      new Role('test_role');
      expect(() => new Role('test_role')).toThrow();
    });
  });

  describe('isFunction', () => {
    test('it should return true give a function', () => {
      expect(isFunction(() => {})).toBe(true);
    });

    test('it should return false given an improper function', () => {
      expect(isFunction('false' as any)).toBe(false);
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

describe('permissions', () => {
  it('should return an empty array if no user roles are provided', async () => {
    const userRoles = [];
    const allRoles = {
      admin: {
        name: 'admin',
        allowRules: {
          createUser: [
            async () => true,
            async () => false,
          ],
        },
      },
    };
    const result = await permissions(userRoles, allRoles);
    expect(result).toEqual([]);
  });

  it('should return the correct permissions for a single user role', async () => {
    const userRoles = ['admin'];
    const allRoles = {
      admin: {
        name: 'admin',
        allowRules: {
          createUser: [
            async () => true,
            async () => false,
          ],
        },
      },
    };
    const result = await permissions(userRoles, allRoles);
    expect(result).toEqual(['createUser']);
  });

  it('should return the correct permissions for multiple user roles', async () => {
    const userRoles = ['admin', 'user'];
    const allRoles = {
      admin: {
        name: 'admin',
        allowRules: {
          createUser: [
            async () => true,
            async () => false,
          ],
        },
      },
      user: {
        name: 'user',
        allowRules: {
          viewUser: [
            async () => true,
            async () => false,
          ],
        },
      },
    };
    const result = await permissions(userRoles, allRoles);
    expect(result).toEqual(['createUser', 'viewUser']);
  });

  it('should return unique and sorted permissions', async () => {
    const userRoles = ['admin', 'user'];
    const allRoles = {
      admin: {
        name: 'admin',
        allowRules: {
          createUser: [
            async () => true,
            async () => true,
          ],
          viewUser: [
            async () => true,
            async () => false,
          ],
        },
      },
      user: {
        name: 'user',
        allowRules: {
          viewUser: [
            async () => true,
            async () => true,
          ],
        },
      },
    };
    const result = await permissions(userRoles, allRoles);
    expect(result).toEqual(['createUser', 'viewUser']);
  });
});


})

