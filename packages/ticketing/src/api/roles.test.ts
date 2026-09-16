import { test } from 'node:test';
import assert from 'node:assert/strict';
import { acl, roles } from '@unchainedshop/api';
import { registerEvents } from '@unchainedshop/events';
import { permissions as listPermissions } from '@unchainedshop/roles';
import { configureTicketingRoles, ticketingActions } from './roles.ts';
import { ticketingResolvers } from './index.ts';

test('authenticated scanners can access active attendees without token ownership or cancellation rights', async () => {
  registerEvents(['ACL_DENIED']);
  const permissions = roles.configureRoles({
    additionalActions: ticketingActions,
    additionalRoles: { ticketing: configureTicketingRoles },
  });
  const product = { _id: 'event', type: 'TOKENIZED_PRODUCT', status: 'ACTIVE' };
  const token = { _id: 'ticket', productId: product._id, userId: 'buyer' };
  const context = {
    userId: 'operator',
    user: { _id: 'operator', roles: ['ticketing'], guest: false },
    roles: permissions,
    getHeader: () => undefined,
    // Old cookies must no longer authorize any access.
    getCookie: () => 'legacy-pass',
    services: { warehousing: { isTokenInvalidateable: async () => true } },
    modules: {
      products: {
        findProduct: async ({ productId }: any) => (productId === product._id ? product : null),
        findProducts: async () => [product],
      },
      warehousing: {
        findToken: async () => token,
        findTokens: async ({ userId, productId }: any) =>
          userId === token.userId && productId.$in.includes(token.productId) ? [token] : [],
        buildAccessKeyFromToken: async () => 'secret',
        invalidateToken: async () => ({ ...token, invalidatedDate: new Date() }),
      },
    },
  };
  const allowed = (action: string, args: any[] = []) =>
    permissions.userHasPermission(context as any, action, args as any);
  const advertised = await listPermissions(['ticketing', '__all__', '__loggedIn__'], permissions.roles);
  assert.ok(advertised.includes('scanTicket'), 'User.allowedActions must expose the scanner menu');
  assert.ok(!advertised.includes('manageProducts'));
  assert.ok(!advertised.includes('cancelTicket'));
  assert.equal(await allowed('scanTicket'), true);
  assert.equal(await allowed('gateControl'), true);
  assert.equal(await allowed('viewTokens', [product, {}]), true);
  assert.equal(await allowed('viewTokens', [{ ...product, status: 'DRAFT' }, {}]), false);
  assert.equal(await allowed('viewTokens', [{ ...product, type: 'SIMPLE_PRODUCT' }, {}]), false);
  assert.equal(await allowed('viewTokens'), false);
  await acl.checkAction(context, 'viewUserPrivateInfos', [{ _id: 'buyer' }, {}]);
  await assert.rejects(
    acl.checkAction(context, 'viewUserPrivateInfos', [{ _id: 'unrelated' }, {}]),
    /permission/i,
  );
  assert.equal(await allowed('updateToken', [undefined, { tokenId: 'ticket' }]), false);
  assert.equal(await allowed('cancelTicket'), false);
  assert.equal(await allowed('manageProducts'), false);
  const redeemed = await ticketingResolvers.Mutation.scanTicket(
    undefined,
    { tokenId: 'ticket' },
    context,
  );
  assert.ok(redeemed.invalidatedDate);
  await assert.rejects(
    ticketingResolvers.Mutation.cancelTicket(undefined, { tokenId: 'ticket' }, context),
    /permission/i,
  );

  for (const identity of [
    { userId: undefined, user: undefined },
    { userId: 'customer', user: { _id: 'customer', roles: [] } },
    { userId: 'guest', user: { _id: 'guest', roles: ['ticketing'], guest: true } },
  ]) {
    const denied = { ...context, ...identity };
    assert.equal(await permissions.userHasPermission(denied as any, 'scanTicket', []), false);
    assert.equal(await permissions.userHasPermission(denied as any, 'gateControl', []), false);
    await assert.rejects(ticketingResolvers.Query.ticketEvents(undefined, {}, denied), /permission/i);
    await assert.rejects(
      ticketingResolvers.Mutation.scanTicket(undefined, { tokenId: 'ticket' }, denied),
      /permission/i,
    );
  }
  const admin = { ...context, user: { ...context.user, roles: ['admin'] }, getCookie: () => undefined };
  assert.equal(await permissions.userHasPermission(admin as any, 'scanTicket', []), true);
  assert.equal(await permissions.userHasPermission(admin as any, 'gateControl', []), true);
  assert.equal(await permissions.userHasPermission(admin as any, 'cancelTicket', []), true);
});
