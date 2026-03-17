import { describe, it } from 'node:test';
import assert from 'node:assert';
import { permissions } from './permissions.ts';

describe('permissions', () => {
  it('should return empty array for empty userRoles', async () => {
    const allRoles = {
      admin: { name: 'admin', allowRules: { createUser: [async () => true] } },
    };
    assert.deepStrictEqual(await permissions([], allRoles), []);
  });

  it('should return empty array for null userRoles', async () => {
    const allRoles = {
      admin: { name: 'admin', allowRules: { createUser: [async () => true] } },
    };
    assert.deepStrictEqual(await permissions(null, allRoles), []);
  });

  it('should return empty array for undefined userRoles', async () => {
    const allRoles = {
      admin: { name: 'admin', allowRules: { createUser: [async () => true] } },
    };
    assert.deepStrictEqual(await permissions(undefined, allRoles), []);
  });

  it('should return permissions for a single role with a single allowed action', async () => {
    const allRoles = {
      admin: { name: 'admin', allowRules: { createUser: [async () => true] } },
    };
    const result = await permissions(['admin'], allRoles);
    assert.deepStrictEqual(result, ['createUser']);
  });

  it('should return permissions for a role with multiple actions (some passing, some failing)', async () => {
    const allRoles = {
      admin: {
        name: 'admin',
        allowRules: {
          createUser: [async () => true],
          deleteUser: [async () => false],
          viewUser: [async () => true],
        },
      },
    };
    const result = await permissions(['admin'], allRoles);
    assert.deepStrictEqual(result, ['createUser', 'viewUser']);
  });

  it('should return deduplicated permissions for multiple roles with overlapping actions', async () => {
    const allRoles = {
      admin: {
        name: 'admin',
        allowRules: {
          createUser: [async () => true],
          viewUser: [async () => true],
        },
      },
      user: {
        name: 'user',
        allowRules: {
          viewUser: [async () => true],
        },
      },
    };
    const result = await permissions(['admin', 'user'], allRoles);
    assert.deepStrictEqual(result, ['createUser', 'viewUser']);
  });

  it('should return sorted results alphabetically', async () => {
    const allRoles = {
      admin: {
        name: 'admin',
        allowRules: {
          zebra: [async () => true],
          alpha: [async () => true],
          middle: [async () => true],
        },
      },
    };
    const result = await permissions(['admin'], allRoles);
    assert.deepStrictEqual(result, ['alpha', 'middle', 'zebra']);
  });

  it('should treat throwing permission functions as false', async () => {
    const allRoles = {
      admin: {
        name: 'admin',
        allowRules: {
          createUser: [
            async () => {
              throw new Error('test error');
            },
          ],
          viewUser: [async () => true],
        },
      },
    };
    const result = await permissions(['admin'], allRoles);
    assert.deepStrictEqual(result, ['viewUser']);
  });

  it('should skip roles not found in allRoles', async () => {
    const allRoles = {
      admin: { name: 'admin', allowRules: { createUser: [async () => true] } },
    };
    const result = await permissions(['admin', 'nonexistent'], allRoles);
    assert.deepStrictEqual(result, ['createUser']);
  });

  it('should handle allRoles with keys different from role names', async () => {
    const allRoles = {
      ADMIN: { name: 'admin', allowRules: { createUser: [async () => true] } },
      LOGGEDIN: { name: '__loggedIn__', allowRules: { viewUser: [async () => true] } },
    };
    const result = await permissions(['admin', '__loggedIn__'], allRoles);
    assert.deepStrictEqual(result, ['createUser', 'viewUser']);
  });

  it('should return empty for roles with empty allowRules', async () => {
    const allRoles = {
      admin: { name: 'admin', allowRules: {} },
    };
    const result = await permissions(['admin'], allRoles);
    assert.deepStrictEqual(result, []);
  });

  it('should not include actions where all permission functions return false', async () => {
    const allRoles = {
      admin: {
        name: 'admin',
        allowRules: {
          createUser: [async () => false, async () => false],
          viewUser: [async () => true],
        },
      },
    };
    const result = await permissions(['admin'], allRoles);
    assert.deepStrictEqual(result, ['viewUser']);
  });

  it('should return permission if at least one function returns true', async () => {
    const allRoles = {
      admin: {
        name: 'admin',
        allowRules: {
          createUser: [async () => false, async () => true, async () => false],
        },
      },
    };
    const result = await permissions(['admin'], allRoles);
    assert.deepStrictEqual(result, ['createUser']);
  });
});
