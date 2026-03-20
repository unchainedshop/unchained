import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { isFunction, permissions, has } from './roles-index.ts';
import { Role, createRoles, type RolesInterface } from './roles.ts';

describe('Role', () => {
  describe('constructor', () => {
    it('should create a new role with the given name', () => {
      assert.strictEqual(new Role('admin').name, 'admin');
    });

    it('should initialize empty allowRules and helpers', () => {
      const role = new Role('admin');
      assert.deepStrictEqual(role.allowRules, {});
      assert.deepStrictEqual(role.helpers, {});
    });
  });

  describe('helper', () => {
    it('should add the helper function to the role', () => {
      const role = new Role('admin');
      role.helper('checkPermission', () => true);
      assert.strictEqual(typeof role.helpers.checkPermission[0], 'function');
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
    it('should register an action rule', () => {
      const testRole = new Role('test_role');
      const actionName = 'view_secret';
      const allowFn = () => true;
      testRole.allow(actionName, allowFn);
      assert.strictEqual(typeof testRole.allowRules[actionName][0], 'function');
    });

    it('should register a helper', () => {
      const testRole = new Role('test_role');
      const helperFn = () => true;
      testRole.helper('test_helper', helperFn);
      assert.strictEqual(typeof testRole.helpers.test_helper[0], 'function');
    });
  });

  describe('Role contruction', () => {
    it('should construct a new role', () => {
      assert.equal(new Role('test_role') instanceof Role, true);
    });
  });
});

describe('createRoles', () => {
  let roles: RolesInterface;

  beforeEach(() => {
    roles = createRoles();
  });

  describe('addRole', () => {
    it('should add a role to roles.roles', () => {
      const role = roles.addRole(new Role('admin'));
      assert.strictEqual(roles.roles['admin'], role);
    });

    it('should throw an error if a role with the same name already exists', () => {
      roles.addRole(new Role('admin'));
      assert.throws(() => roles.addRole(new Role('admin')), /"admin" role is already defined/);
    });
  });

  describe('registerAction', () => {
    it('should add an action', () => {
      roles.registerAction('test_action');
      assert.deepStrictEqual(roles.actions, ['test_action']);
    });

    it('should skip adding action if it already exists', () => {
      roles.registerAction('test_action');
      roles.registerAction('test_action');
      assert.deepStrictEqual(roles.actions, ['test_action']);
    });
  });

  describe('registerHelper', () => {
    it('should add a helper', () => {
      roles.registerHelper('test_helper');
      assert.deepStrictEqual(roles.helpers, ['test_helper']);
    });

    it('should skip adding helper if it already exists', () => {
      roles.registerHelper('test_helper');
      roles.registerHelper('test_helper');
      assert.deepStrictEqual(roles.helpers, ['test_helper']);
    });
  });

  describe('getUserRoles', () => {
    it('should return the correct roles for a logged-in user', () => {
      const result = roles.getUserRoles('user1', ['admin'], true);
      assert.deepStrictEqual(result, ['admin', '__all__', '__loggedIn__']);
    });

    it('should return the correct roles for a logged-out user', () => {
      const result = roles.getUserRoles(null as any, ['admin'], true);
      assert.deepStrictEqual(result, ['admin', '__all__', '__notLoggedIn__']);
    });

    it('should return the correct roles when includeSpecial is false', () => {
      const result = roles.getUserRoles('user1', ['admin'], false);
      assert.deepStrictEqual(result, ['admin']);
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
