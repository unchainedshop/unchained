// Import the function to be tested.
import { describe, it, mock } from 'node:test';
import assert from 'node:assert';
import { admin } from '../src/roles/admin.js';
import { actions } from '../src/roles/index.js';
import { checkAction, ensureActionExists, ensureIsFunction } from '../src/acl.js';
import { NoPermissionError, PermissionSystemError } from '../src/errors.js';
import { Roles } from '@unchainedshop/roles';

describe('API', () => {
  describe('roles', () => {
    const role = {
      allow: mock.fn(),
    };

    it('creates the admin role and grants permissions to all actions', () => {
      admin(role, actions);
      for (const actionName of Object.keys(actions)) {
        assert.equal(
          role.allow.mock.calls.some((call) => call.arguments[0] === actions[actionName]),
          true,
          "action wasn't granted",
        );
      }
    });
  });

  describe('ensureActionExists', () => {
    it('should throw a PermissionSystemError if the action is undefined', () => {
      assert.throws(() => ensureActionExists(undefined, {}), PermissionSystemError);
    });

    it('should not throw an error if the action is defined', () => {
      assert.doesNotThrow(() => ensureActionExists('some action', {}));
    });
  });

  describe('ensureIsFunction', () => {
    it('should throw a PermissionSystemError if the provided value is not a function', () => {
      const action = 'some action';
      const options = { showKey: true };
      const key = 'some key';
      assert.throws(() => ensureIsFunction(null, action, options, key), PermissionSystemError);
    });

    it('should not throw an error if the provided value is a function', () => {
      const action = 'some action';
      const options = { showKey: true };
      const key = 'some key';
      assert.doesNotThrow(() =>
        ensureIsFunction(
          () => {
            /**/
          },
          action,
          options,
          key,
        ),
      );
    });
  });

  describe('checkAction', () => {
    it('should throw a NoPermissionError if the user does not have permission to perform the action', async () => {
      Roles.userHasPermission = mock.fn(async () => false);

      const context = { userId: '123' };
      const action = 'some action';
      const args: any = [];
      const options = { key: 'some key' };

      return assert.rejects(checkAction(context, action, args, options), NoPermissionError);
    });

    it('should not throw an error if the user has permission to perform the action', async () => {
      Roles.userHasPermission = mock.fn(async () => true);

      const context = { userId: '123' };
      const action = 'some action';
      const args: any = {};
      const options = { key: 'some key' };

      return assert.doesNotReject(checkAction(context, action, args, options));
    });
  });
});
