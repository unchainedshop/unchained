// Import the function to be tested.
import { describe, it, mock } from 'node:test';
import assert from 'node:assert';
import { createRoles, Role } from '@unchainedshop/roles';
import { admin } from '../src/roles/admin.ts';
import { actions } from '../src/roles/index.ts';
import { checkAction, ensureActionExists, ensureIsFunction } from '../src/acl.ts';
import { NoPermissionError, PermissionSystemError } from '../src/errors.ts';
import { registerEvents } from '@unchainedshop/events';
import { API_EVENTS } from '../src/events.ts';
import Mutation from '../src/resolvers/mutations/index.ts';

// Register API events for ACL audit logging
registerEvents(Object.keys(API_EVENTS));

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

    it('does not let legacy manage permissions authorize bulk mutations', async () => {
      const roles = createRoles();
      const operatorRole = roles.addRole(new Role('operator'));
      const legacyActions = [
        actions.manageProducts,
        actions.manageAssortments,
        actions.manageFilters,
        actions.manageUsers,
      ];
      legacyActions.forEach((action) => operatorRole.allow(action, () => true));

      const context = {
        userId: 'operator-id',
        user: { roles: ['operator'] },
        roles,
      } as any;

      const bulkMutations = [
        ['bulkSetProductStatus', { productIds: ['product-id'], status: 'ACTIVE' }],
        ['bulkUpdateProductTags', { productIds: ['product-id'], add: ['tag'] }],
        [
          'bulkAssignProductsToAssortment',
          { productIds: ['product-id'], assortmentId: 'assortment-id' },
        ],
        ['bulkRemoveProducts', { productIds: ['product-id'] }],
        ['bulkUpdateUserTags', { userIds: ['user-id'], add: ['tag'] }],
        ['bulkRemoveUsers', { userIds: ['user-id'] }],
        ['bulkSetUserRoles', { userIds: ['user-id'], roles: ['operator'] }],
        ['bulkRemoveAssortments', { assortmentIds: ['assortment-id'] }],
        ['bulkUpdateAssortmentTags', { assortmentIds: ['assortment-id'], add: ['tag'] }],
        ['bulkSetAssortmentActive', { assortmentIds: ['assortment-id'], isActive: true }],
        ['bulkRemoveFilters', { filterIds: ['filter-id'] }],
        ['bulkSetFilterActive', { filterIds: ['filter-id'], isActive: true }],
      ] as const;

      for (const [mutationName, params] of bulkMutations) {
        await assert.rejects(
          () => Mutation[mutationName](null, params, context, {}),
          (error: any) => error?.extensions?.code === 'NoPermissionError',
          `${mutationName} inherited a legacy manage permission`,
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
      const context = {
        userId: '123',
        roles: { userHasPermission: mock.fn(async () => false) },
      };
      const action = 'some action';
      const args: any = [];
      const options = { key: 'some key' };

      return assert.rejects(checkAction(context, action, args, options), NoPermissionError);
    });

    it('should not throw an error if the user has permission to perform the action', async () => {
      const context = {
        userId: '123',
        roles: { userHasPermission: mock.fn(async () => true) },
      };
      const action = 'some action';
      const args: any = {};
      const options = { key: 'some key' };

      return assert.doesNotReject(checkAction(context, action, args, options));
    });
  });
});
