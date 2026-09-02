import { describe, it } from 'node:test';
import assert from 'node:assert';
import type { Context } from '../../../context.ts';
import removeUser from './removeUser.ts';
import setRoles from './setRoles.ts';

describe('last administrator API errors', () => {
  it('exposes a typed GraphQL error when the last admin role is revoked', async () => {
    const context = {
      userId: 'only-admin',
      modules: {
        users: {
          userExists: async () => true,
          updateRoles: async () => {
            throw new Error('At least one active administrator is required', {
              cause: 'LAST_ADMIN',
            });
          },
        },
      },
    } as unknown as Context;

    await assert.rejects(
      () => setRoles(undefined as never, { userId: 'only-admin', roles: [] }, context),
      (error: any) =>
        error.extensions?.code === 'LastAdminError' &&
        error.message.includes('At least one active administrator'),
    );
  });

  it('exposes a typed GraphQL error when the last admin is removed', async () => {
    const context = {
      userId: 'only-admin',
      modules: {
        users: { userExists: async () => true },
        products: { reviews: { deleteByAuthorId: async () => undefined } },
      },
      services: {
        users: {
          deleteUser: async () => {
            throw new Error('At least one active administrator is required', {
              cause: 'LAST_ADMIN',
            });
          },
        },
      },
    } as unknown as Context;

    await assert.rejects(
      () => removeUser(undefined as never, { userId: 'only-admin' }, context),
      (error: any) =>
        error.extensions?.code === 'LastAdminError' &&
        error.message.includes('At least one active administrator'),
    );
  });
});
