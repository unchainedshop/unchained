import { describe, it, beforeEach, mock } from 'node:test';
import assert from 'node:assert';
import { createRoles, Role } from '@unchainedshop/roles';
import { registerEvents } from '@unchainedshop/events';
import {
  checkAction,
  checkResolver,
  checkTypeResolver,
  ensureActionExists,
  ensureIsFunction,
} from './acl.ts';

registerEvents(['ACL_DENIED', 'ACL_GRANTED_SENSITIVE']);

describe('acl', () => {
  let roles;

  beforeEach(() => {
    roles = createRoles();
    roles.adminRole = roles.addRole(new Role('admin'));
    roles.loggedInRole = roles.addRole(new Role('__loggedIn__'));
    roles.allRole = roles.addRole(new Role('__all__'));
  });

  describe('ensureActionExists', () => {
    it('should not throw when action is provided', () => {
      assert.doesNotThrow(() => ensureActionExists('testAction', {}));
    });

    it('should throw PermissionSystemError when action is null', () => {
      assert.throws(
        () => ensureActionExists(null, {}),
        (err: any) => {
          return err.extensions?.code === 'PermissionSystemError';
        },
      );
    });
  });

  describe('ensureIsFunction', () => {
    it('should not throw when fn is a function', () => {
      assert.doesNotThrow(() => ensureIsFunction(() => true, 'action', { showKey: true }, 'key'));
    });

    it('should throw PermissionSystemError when fn is not a function', () => {
      assert.throws(
        () => ensureIsFunction('not a function', 'action', { showKey: true }, 'key'),
        (err: any) => {
          return err.extensions?.code === 'PermissionSystemError';
        },
      );
    });
  });

  describe('checkAction', () => {
    it('should not throw when user has permission', async () => {
      roles.adminRole!.allow('testAction', () => true);
      const context = { userId: 'user1', user: { roles: ['admin'] }, roles };
      await assert.doesNotReject(() => checkAction(context, 'testAction'));
    });

    it('should throw NoPermissionError when user lacks permission', async () => {
      const context = { userId: 'user1', user: { roles: ['admin'] }, roles };
      await assert.rejects(
        () => checkAction(context, 'nonExistentAction'),
        (err: any) => {
          return err.extensions?.code === 'NoPermissionError';
        },
      );
    });

    it('should include userId and action in error', async () => {
      const context = { userId: 'user1', user: { roles: [] }, roles };
      await assert.rejects(
        () => checkAction(context, 'testAction', [], { key: 'myKey' }),
        (err: any) => {
          return (
            err.extensions?.code === 'NoPermissionError' &&
            err.extensions?.userId === 'user1' &&
            err.extensions?.action === 'testAction' &&
            err.extensions?.key === 'myKey'
          );
        },
      );
    });
  });

  describe('checkResolver', () => {
    it('should return a decorator that wraps functions', () => {
      roles.adminRole!.allow('testAction', () => true);
      const decorator = checkResolver('testAction');
      const wrappedFn = decorator(async () => 'result', 'testFn');
      assert.strictEqual(typeof wrappedFn, 'function');
    });

    it('should throw when action is null', () => {
      assert.throws(
        () => checkResolver(null),
        (err: any) => {
          return err.extensions?.code === 'PermissionSystemError';
        },
      );
    });

    it('wrapped function should call underlying fn when permitted', async () => {
      roles.adminRole!.allow('testAction', () => true);
      const decorator = checkResolver('testAction');
      const fn = mock.fn(async () => 'result');
      const wrapped = decorator(fn, 'testFn');
      const context = { userId: 'user1', user: { roles: ['admin'] }, roles };
      const result = await wrapped('root', { id: 1 }, context, { fieldName: 'test' });
      assert.strictEqual(result, 'result');
      assert.strictEqual(fn.mock.calls.length, 1);
    });

    it('wrapped function should throw when not permitted', async () => {
      const decorator = checkResolver('testAction');
      const fn = mock.fn(async () => 'result');
      const wrapped = decorator(fn, 'testFn');
      const context = { userId: 'user1', user: { roles: [] }, roles };
      await assert.rejects(
        () => wrapped('root', {}, context, {}),
        (err: any) => {
          return err.extensions?.code === 'NoPermissionError';
        },
      );
      assert.strictEqual(fn.mock.calls.length, 0);
    });

    it('wrapped function should pass correct args (root, params, context, info)', async () => {
      roles.adminRole!.allow('testAction', () => true);
      const decorator = checkResolver('testAction');
      const fn = mock.fn(async (_root, _params, _context, _info) => ({
        root: _root,
        params: _params,
        info: _info,
      }));
      const wrapped = decorator(fn, 'testFn');
      const context = { userId: 'user1', user: { roles: ['admin'] }, roles };
      const info = { fieldName: 'test' };
      const result = await wrapped('myRoot', { id: 42 }, context, info);
      assert.deepStrictEqual(result, { root: 'myRoot', params: { id: 42 }, info });
    });
  });

  describe('checkTypeResolver', () => {
    it('should resolve object property when permitted', async () => {
      roles.adminRole!.allow('testAction', () => true);
      const resolver = checkTypeResolver('testAction', 'name');
      const context = { userId: 'user1', user: { roles: ['admin'] }, roles };
      const result = await resolver({ name: 'Alice' }, {}, context);
      assert.strictEqual(result, 'Alice');
    });

    it('should call function property when permitted', async () => {
      roles.adminRole!.allow('testAction', () => true);
      const resolver = checkTypeResolver('testAction', 'getName');
      const context = { userId: 'user1', user: { roles: ['admin'] }, roles };
      const result = await resolver({ getName: () => 'Alice' }, {}, context);
      assert.strictEqual(result, 'Alice');
    });

    it('should throw when not permitted', async () => {
      const resolver = checkTypeResolver('testAction', 'name');
      const context = { userId: 'user1', user: { roles: [] }, roles };
      await assert.rejects(
        () => resolver({ name: 'Alice' }, {}, context),
        (err: any) => {
          return err.extensions?.code === 'NoPermissionError';
        },
      );
    });
  });
});
