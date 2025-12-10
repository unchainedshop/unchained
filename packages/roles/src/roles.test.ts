import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { isFunction, permissions, has } from './roles-index.ts';
import { Role, Roles } from './roles.ts';

describe('Role', () => {
  beforeEach(() => {
    Roles.roles = {};
    Roles.actions = [];
    Roles.helpers = [];
  });

  describe('constructor', () => {
    it('should create a new role with the given name', () => {
      assert.strictEqual(new Role('admin').name, 'admin');
    });

    it('should throw an error if a role with the same name already exists', () => {
      new Role('admin');
      assert.throws(() => new Role('admin'), /"admin" role is already defined/);
    });
  });

  describe('helper', () => {
    it('should add the helper function to the role', () => {
      const role = new Role('admin');
      role.helper('checkPermission', () => true);
      assert.strictEqual(typeof role.helpers.checkPermission[0], 'function');
    });

    it('should add the helper to the list of helpers if it does not exist', () => {
      const role = new Role('admin');
      role.helper('checkPermission', () => true);
      assert.deepStrictEqual(Roles.helpers, ['checkPermission']);
    });

    it('should convert a non-function value to a function that returns that value', () => {
      const role = new Role('admin');
      role.helper('checkPermission', true);
      assert.strictEqual(typeof role.helpers.checkPermission[0], 'function');
      assert.strictEqual(role.helpers.checkPermission[0](), true);
    });
  });

  describe('allow', () => {
    it('should add the allow function to the role', () => {
      const role = new Role('admin');
      role.allow('createUser', () => true);
      assert.strictEqual(typeof role.allowRules.createUser[0], 'function');
    });

    it('should add the action to the list of actions if it does not exist', () => {
      const role = new Role('admin');
      role.allow('createUser', () => true);
      assert.deepStrictEqual(Roles.actions, ['createUser']);
    });

    it('should throw an error if the action does not exist', () => {
      const role = new Role('admin');
      assert.throws(() => role.allow(null, () => true), /Action doesn't exist/);
    });

    it('should convert a non-function value to a function that returns that value', () => {
      const role = new Role('admin');
      role.allow('createUser', true);
      assert.strictEqual(typeof role.allowRules.createUser[0], 'function');
      assert.strictEqual(role.allowRules.createUser[0](), true);
    });
  });

  describe('Role utilities', () => {
    const testRole = new Role('test_role');
    const actionName = 'view_secret';

    it('should register an action rule', () => {
      const allowFn = () => true;
      testRole.allow(actionName, allowFn);
      assert.strictEqual(typeof testRole.allowRules[actionName][0], 'function');
    });

    it('should register a helper', () => {
      const helperFn = () => true;
      testRole.helper('test_helper', helperFn);
      assert.strictEqual(typeof testRole.helpers.test_helper[0], 'function');
    });
  });

  describe('Role Helper Registration', () => {
    it('should add a helper', () => {
      Roles.registerHelper('test_helper');
      assert.deepStrictEqual(Roles.helpers, ['test_helper']);
    });

    it('should add a helper attaching it to adminRole', () => {
      Roles.registerHelper('test_admin_helper');
      assert(Roles.helpers.includes('test_admin_helper'));
    });

    it('should skip adding helper if it already exists', () => {
      Roles.registerHelper('test_helper');
      Roles.registerHelper('test_admin_helper');
      assert(Roles.helpers.includes('test_helper'));
      assert(Roles.helpers.includes('test_admin_helper'));
    });
  });

  describe('Action registration', () => {
    it('should add an action', () => {
      Roles.registerAction('test_action');
      assert.deepStrictEqual(Roles.actions, ['test_action']);
    });

    it('should skip adding action if it already exists', () => {
      Roles.registerAction('test_action');
      assert.deepStrictEqual(Roles.actions, ['test_action']);
    });
  });

  describe('Role contruction', () => {
    it('should construct a new role', () => {
      assert.equal(new Role('test_role') instanceof Role, true);
    });

    it('should throw an error if given a role with similar name', () => {
      new Role('test_role');
      assert.throws(() => new Role('test_role'));
    });
  });

  describe('isFunction', () => {
    it('should return true given a function', () => {
      assert.strictEqual(
        isFunction(() => ({})),
        true,
      );
    });

    it('should return false given an improper function', () => {
      assert.strictEqual(isFunction('false' as any), false);
    });
  });

  describe('has', () => {
    it('should return true for existent key', () => {
      const obj = {
        foo: 'bar',
      };
      assert.strictEqual(has(obj, 'foo'), true);
    });

    it('should return true for existent nested key', () => {
      const obj = {
        foo: { bar: 'baz' },
      };
      assert.strictEqual(has(obj, 'foo.bar'), true);
    });

    it('should return false for non existent', () => {
      const obj = {
        foo: 'bar',
      };
      assert.strictEqual(has(obj, 'baz'), false);
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
    assert.deepStrictEqual(result, []);
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
    assert.deepStrictEqual(result, ['createUser']);
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
    assert.deepStrictEqual(result, ['createUser', 'viewUser']);
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
    assert.deepStrictEqual(result, ['createUser', 'viewUser']);
  });
});

describe('registerAction', () => {
  it('should add a new action to the list of actions if it does not already exist', () => {
    const action = 'createUser';
    Roles.registerAction(action);
    assert(Roles.actions.includes(action));
  });

  it('should not add the same action multiple times', () => {
    const action = 'createUser';
    Roles.registerAction(action);
    Roles.registerAction(action);
    assert.deepStrictEqual(Roles.actions, [action]);
  });
});

describe('registerHelper', () => {
  it('should add a new helper to the list of helpers if it does not already exist', () => {
    const helper = 'checkAdmin';
    Roles.registerHelper(helper);
    assert(Roles.helpers.includes(helper));
  });

  it('should not add the same helper multiple times', () => {
    const helper = 'checkAdmin';
    Roles.registerHelper(helper);
    Roles.registerHelper(helper);
    assert.deepStrictEqual(Roles.helpers, [helper]);
  });
});

describe('getUserRoles', () => {
  it('should return the correct roles for a logged-in user', () => {
    const userId = 'user1';
    const roles = ['admin'];
    const includeSpecial = true;
    const expected = ['admin', '__all__', '__loggedIn__'];
    const result = Roles.getUserRoles(userId, roles, includeSpecial);
    assert.deepStrictEqual(result, expected);
  });

  it('should return the correct roles for a logged-out user', () => {
    const userId = null;
    const roles = ['admin'];
    const includeSpecial = true;
    const expected = ['admin', '__all__', '__notLoggedIn__'];
    const result = Roles.getUserRoles(userId as any, roles, includeSpecial);
    assert.deepStrictEqual(result, expected);
  });

  it('should return the correct roles when includeSpecial is false', () => {
    const userId = 'user1';
    const roles = ['admin'];
    const includeSpecial = false;
    const expected = ['admin'];
    const result = Roles.getUserRoles(userId, roles, includeSpecial);
    assert.deepStrictEqual(result, expected);
  });
});
