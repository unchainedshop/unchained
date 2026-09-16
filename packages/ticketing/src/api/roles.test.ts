import { test } from 'node:test';
import assert from 'node:assert/strict';
import { acl, roles } from '@unchainedshop/api';
import { registerEvents } from '@unchainedshop/events';
import { configureTicketingRoles, ticketingActions } from './roles.ts';
import { ticketingResolvers } from './index.ts';

test('gate capabilities are restricted to authorized events and attendees', async () => {
  registerEvents(['ACL_DENIED']);
  const permissions = roles.configureRoles({
    additionalActions: ticketingActions,
    additionalRoles: { ticketing: configureTicketingRoles },
  });
  const token = { _id: 'ticket', productId: 'authorized-event', userId: 'buyer' };
  const context = {
    roles: permissions,
    getCookie: () => 'pass',
    services: {
      ticketing: {
        isPassCodeValid: async (_code: string, productId?: string) =>
          !productId || productId === token.productId,
        productIdsForPassCode: async () => [token.productId],
      },
    },
    modules: {
      warehousing: {
        findToken: async () => token,
        findTokens: async ({ userId, productId }: any) =>
          userId === token.userId && productId.$in.includes(token.productId) ? [token] : [],
      },
    },
  };
  assert.equal(await permissions.userHasPermission(context as any, 'gateControl', []), true);
  assert.equal(
    await permissions.userHasPermission(context as any, 'viewTokens', [{ _id: token.productId }, {}]),
    true,
  );
  assert.equal(
    await permissions.userHasPermission(context as any, 'viewTokens', [{ _id: 'other-event' }, {}]),
    false,
  );
  const attendee = { _id: 'buyer', profile: { displayName: 'Attendee' } };
  await acl.checkAction(context, 'viewUserPrivateInfos', [attendee, {}]);
  await assert.rejects(
    acl.checkAction(context, 'viewUserPrivateInfos', [{ _id: 'unrelated-author' }, {}]),
    /permission/i,
  );
  assert.equal(
    await permissions.userHasPermission(context as any, 'updateToken', [
      undefined,
      { tokenId: 'ticket' },
    ]),
    true,
  );
  assert.equal(await permissions.userHasPermission(context as any, 'cancelTicket', []), false);
  await assert.rejects(
    ticketingResolvers.Mutation.cancelTicket(
      undefined,
      { tokenId: 'ticket', generateDiscount: true },
      context,
    ),
    /permission/i,
  );
  const customer = { ...context, userId: 'buyer', getCookie: () => undefined };
  assert.equal(await permissions.userHasPermission(customer as any, 'gateControl', []), false);
  await assert.rejects(
    ticketingResolvers.Mutation.cancelTicket(
      undefined,
      { tokenId: 'ticket', generateDiscount: true },
      customer,
    ),
    /permission/i,
  );
  const admin = { ...customer, user: { roles: ['admin'] } };
  assert.equal(await permissions.userHasPermission(admin as any, 'gateControl', []), true);
  assert.equal(await permissions.userHasPermission(admin as any, 'cancelTicket', []), true);
});
