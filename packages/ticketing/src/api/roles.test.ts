import { test } from 'node:test';
import assert from 'node:assert/strict';
import { acl, roles } from '@unchainedshop/api';
import { registerEvents } from '@unchainedshop/events';
import { permissions as listPermissions } from '@unchainedshop/roles';
import { configureTicketingRoles, ticketingActions } from './roles.ts';
import { ticketingResolvers } from './index.ts';

registerEvents(['ACL_DENIED']);
const permissions = roles.configureRoles({
  additionalActions: ticketingActions,
  additionalRoles: {
    ticketing: configureTicketingRoles,
    manager: (role: any, actions: Record<string, string>) =>
      role.allow(actions.manageProducts, () => true),
  },
});

const event = { _id: 'event', type: 'TOKENIZED_PRODUCT', status: 'ACTIVE' };
const draft = { _id: 'draft', type: 'TOKENIZED_PRODUCT', status: 'DRAFT' };
const tickets = [
  { _id: 'ticket', productId: event._id, userId: 'buyer' },
  { _id: 'draft-ticket', productId: draft._id, userId: 'early-bird' },
];

function createContext(user?: { _id: string; roles: string[]; guest?: boolean }) {
  return {
    userId: user?._id,
    user,
    roles: permissions,
    getHeader: () => undefined,
    // Old cookies must no longer authorize any access.
    getCookie: () => 'legacy-pass',
    services: { warehousing: { isTokenInvalidateable: async () => true } },
    modules: {
      products: {
        findProduct: async ({ productId }: any) =>
          [event, draft].find((product) => product._id === productId) || null,
        findProducts: async () => [event],
      },
      warehousing: {
        findToken: async ({ tokenId }: any) => tickets.find((t) => t._id === tokenId) || null,
        buildAccessKeyFromToken: async () => 'secret',
        invalidateToken: async () => ({ ...tickets[0], invalidatedDate: new Date() }),
      },
    },
  };
}

const allowed = (context: any, action: string, args: any[] = []) =>
  permissions.userHasPermission(context, action, args as any);
const canViewPrivateInfos = (context: any, userId: string) =>
  acl.checkAction(context, 'viewUserPrivateInfos', [{ _id: userId }, {}]);

test('scanners see active events and attendee contacts but no user accounts, and cannot export, cancel or reimburse', async () => {
  const context = createContext({ _id: 'operator', roles: ['ticketing'] });
  const advertised = await listPermissions(['ticketing', '__all__', '__loggedIn__'], permissions.roles);
  assert.ok(advertised.includes('scanTicket'), 'User.allowedActions must expose the scanner menu');
  assert.ok(!advertised.includes('manageProducts'));
  assert.ok(!advertised.includes('cancelTicket'));
  assert.equal(await allowed(context, 'scanTicket'), true);
  assert.equal(await allowed(context, 'gateControl'), true);
  assert.equal(await allowed(context, 'viewTokens', [event, {}]), true);
  assert.equal(await allowed(context, 'viewTokens', [draft, {}]), false);
  assert.equal(await allowed(context, 'viewTokens', [{ ...event, type: 'SIMPLE_PRODUCT' }, {}]), false);
  assert.equal(await allowed(context, 'viewTokens'), false);
  assert.equal(await allowed(context, 'viewAttendees', [event, {}]), true);
  assert.equal(await allowed(context, 'viewAttendees', [draft, {}]), false);
  for (const holder of ['buyer', 'early-bird', 'unrelated']) {
    await assert.rejects(canViewPrivateInfos(context, holder), /permission/i);
  }
  assert.equal(await allowed(context, 'updateToken', [undefined, { tokenId: 'ticket' }]), false);
  assert.equal(await allowed(context, 'cancelTicket'), false);
  assert.equal(await allowed(context, 'manageProducts'), false);
  const events = await ticketingResolvers.Query.ticketEvents(undefined, {}, context as any);
  assert.deepEqual(events, [event]);
  const redeemed = await ticketingResolvers.Mutation.scanTicket(
    undefined,
    { tokenId: 'ticket' },
    context as any,
  );
  assert.ok(redeemed.invalidatedDate);
  for (const cancel of [
    ticketingResolvers.Mutation.cancelTicket(undefined, { tokenId: 'ticket' }, context as any),
    ticketingResolvers.Mutation.cancelEvent(undefined, { productId: event._id }, context as any),
  ]) {
    await assert.rejects(cancel, /permission/i);
  }
});

test('product managers browse drafts and attendees but need cancelTicket to cancel or reimburse', async () => {
  const context = createContext({ _id: 'manager', roles: ['manager'] });
  assert.equal(await allowed(context, 'gateControl'), true);
  assert.equal(await allowed(context, 'scanTicket'), false);
  assert.equal(await allowed(context, 'cancelTicket'), false);
  assert.equal(await allowed(context, 'viewTokens', [event, {}]), true);
  assert.equal(await allowed(context, 'viewTokens', [draft, {}]), true);
  assert.equal(await allowed(context, 'viewTokens', [{ ...draft, type: 'SIMPLE_PRODUCT' }, {}]), false);
  assert.equal(await allowed(context, 'viewAttendees', [draft, {}]), true);
  for (const holder of ['buyer', 'early-bird', 'unrelated']) {
    await assert.rejects(canViewPrivateInfos(context, holder), /permission/i);
  }
  await assert.rejects(
    ticketingResolvers.Mutation.scanTicket(undefined, { tokenId: 'ticket' }, context as any),
    /permission/i,
  );
  await assert.rejects(
    ticketingResolvers.Mutation.cancelEvent(undefined, { productId: event._id }, context as any),
    /permission/i,
  );
});

test('anonymous requests, customers and guests are denied gate access', async () => {
  for (const user of [
    undefined,
    { _id: 'customer', roles: [] },
    { _id: 'guest', roles: ['ticketing'], guest: true },
  ]) {
    const denied = createContext(user);
    assert.equal(await allowed(denied, 'scanTicket'), false);
    assert.equal(await allowed(denied, 'gateControl'), false);
    assert.equal(await allowed(denied, 'viewTokens', [event, {}]), false);
    assert.equal(await allowed(denied, 'viewAttendees', [event, {}]), false);
    await assert.rejects(canViewPrivateInfos(denied, 'buyer'), /permission/i);
    await assert.rejects(
      ticketingResolvers.Query.ticketEvents(undefined, {}, denied as any),
      /permission/i,
    );
    await assert.rejects(
      ticketingResolvers.Mutation.scanTicket(undefined, { tokenId: 'ticket' }, denied as any),
      /permission/i,
    );
  }
});

test('administrators hold every ticketing action', async () => {
  const admin = createContext({ _id: 'admin', roles: ['admin'] });
  for (const action of ticketingActions) {
    assert.equal(await allowed(admin, action), true);
  }
});
