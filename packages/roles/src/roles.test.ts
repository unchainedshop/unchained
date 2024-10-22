import { isFunction, permissions, has } from './roles-index.js';
import { Role, Roles } from './roles.js';

describe('Role', () => {
  beforeEach(() => {
    Roles.roles = {};
    Roles.actions = [];
    Roles.helpers = [];
  });
  describe('constructor', () => {
    it('should create a new role with the given name', () => {
      expect(new Role('admin').name).toBe('admin');
    });

    it('should throw an error if a role with the same name already exists', () => {
      new Role('admin');
      expect(() => new Role('admin')).toThrowError('"admin" role is already defined');
    });
  });

  describe('helper', () => {
    it('should add the helper function to the role', () => {
      const role = new Role('admin');
      role.helper('checkPermission', () => true);
      expect(role.helpers.checkPermission).toEqual([expect.any(Function)]);
    });

    it('should add the helper to the list of helpers if it does not exist', () => {
      const role = new Role('admin');
      role.helper('checkPermission', () => true);
      expect(Roles.helpers).toEqual(['checkPermission']);
    });

    it('should convert a non-function value to a function that returns that value', () => {
      const role = new Role('admin');
      role.helper('checkPermission', true);
      expect(role.helpers.checkPermission).toEqual([expect.any(Function)]);
      expect(role.helpers.checkPermission[0]()).toBe(true);
    });
  });

  describe('allow', () => {
    it('should add the allow function to the role', () => {
      const role = new Role('admin');
      role.allow('createUser', () => true);
      expect(role.allowRules.createUser).toEqual([expect.any(Function)]);
    });

    it('should add the action to the list of actions if it does not exist', () => {
      const role = new Role('admin');
      role.allow('createUser', () => true);
      expect(Roles.actions).toEqual(['createUser']);
    });

    it('should throw an error if the action does not exist', () => {
      const role = new Role('admin');
      expect(() => role.allow(null, () => true)).toThrowError("Action doesn't exist");
    });

    it('should convert a non-function value to a function that returns that value', () => {
      const role = new Role('admin');
      role.allow('createUser', true);
      expect(role.allowRules.createUser).toEqual([expect.any(Function)]);
      expect(role.allowRules.createUser[0]()).toBe(true);
    });
  });

  describe('Role utilities', () => {
    const testRole = new Role('test_role');
    const actionName = 'view_secret';

    it('should register an action rule', () => {
      const allowFn = () => true;
      testRole.allow(actionName, allowFn);
      expect(testRole.allowRules[actionName]).toEqual(expect.arrayContaining([allowFn]));
    });

    it('should register a helper', () => {
      const helperFn = () => true;
      testRole.helper('test_helper', helperFn);
      expect(testRole.helpers.test_helper).toEqual(expect.arrayContaining([helperFn]));
    });
  });
  describe('Role Helper Registration', () => {
    it('should add a helper', () => {
      Roles.registerHelper('test_helper');
      expect(Roles.helpers).toEqual(['test_helper']);
    });

    it('should add a helper attaching it to adminRole', () => {
      Roles.registerHelper('test_admin_helper');
      expect(Roles.helpers).toEqual(expect.arrayContaining(['test_admin_helper']));
    });

    it('should skip adding helper if it already exists', () => {
      Roles.registerHelper('test_helper');
      Roles.registerHelper('test_admin_helper');

      expect(Roles.helpers).toEqual(expect.arrayContaining(['test_helper', 'test_admin_helper']));
    });
  });

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

  describe('Role contruction', () => {
    it('should construct a new role', () => {
      expect(new Role('test_role')).toMatchObject({
        name: 'test_role',
        allowRules: {},
        helpers: {},
      });
    });

    it('should throw an error if given a role with similar name', () => {
      new Role('test_role');
      expect(() => new Role('test_role')).toThrow();
    });
  });

  describe('isFunction', () => {
    test('it should return true give a function', () => {
      expect(
        isFunction(() => {
          /**/
        }),
      ).toBe(true);
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
          createUser: [async () => true, async () => false],
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
          createUser: [async () => true, async () => false],
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
          createUser: [async () => true, async () => false],
        },
      },
      user: {
        name: 'user',
        allowRules: {
          viewUser: [async () => true, async () => false],
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
          createUser: [async () => true, async () => true],
          viewUser: [async () => true, async () => false],
        },
      },
      user: {
        name: 'user',
        allowRules: {
          viewUser: [async () => true, async () => true],
        },
      },
    };
    const result = await permissions(userRoles, allRoles);
    expect(result).toEqual(['createUser', 'viewUser']);
  });
});

describe('registerAction', () => {
  it('should add a new action to the list of actions if it does not already exist', () => {
    const action = 'createUser';
    Roles.registerAction(action);
    expect(Roles.actions).toContain(action);
  });

  it('should not add the same action multiple times', () => {
    const action = 'createUser';
    Roles.registerAction(action);
    Roles.registerAction(action);
    expect(Roles.actions).toEqual([action]);
  });
});

describe('registerHelper', () => {
  it('should add a new helper to the list of helpers if it does not already exist', () => {
    const helper = 'checkAdmin';
    Roles.registerHelper(helper);
    expect(Roles.helpers).toContain(helper);
  });

  it('should not add the same helper multiple times', () => {
    const helper = 'checkAdmin';
    Roles.registerHelper(helper);
    Roles.registerHelper(helper);
    expect(Roles.helpers).toEqual([helper]);
  });
});

describe('getUserRoles', () => {
  it('should return the correct roles for a logged-in user', () => {
    const userId = 'user1';
    const roles = ['admin'];
    const includeSpecial = true;
    const expected = ['admin', '__all__', '__loggedIn__'];
    const result = Roles.getUserRoles(userId, roles, includeSpecial);
    expect(result).toEqual(expected);
  });

  it('should return the correct roles for a logged-out user', () => {
    const userId = null;
    const roles = ['admin'];
    const includeSpecial = true;
    const expected = ['admin', '__all__', '__notLoggedIn__'];
    const result = Roles.getUserRoles(userId as any, roles, includeSpecial);
    expect(result).toEqual(expected);
  });

  it('should return the correct roles when includeSpecial is false', () => {
    const userId = 'user1';
    const roles = ['admin'];
    const includeSpecial = false;
    const expected = ['admin'];
    const result = Roles.getUserRoles(userId, roles, includeSpecial);
    expect(result).toEqual(expected);
  });
});
