import { test } from 'node:test';
import assert from 'node:assert/strict';
import { acl, roles } from '@unchainedshop/api';
import { registerEvents } from '@unchainedshop/events';
import { permissions as listPermissions } from '@unchainedshop/roles';
import { configureTicketingRoles, createTicketingRoles, ticketingActions } from './roles.ts';
import { ticketingResolvers } from './index.ts';

// roles.configureRoles replaces the roles of a platform in the same process; these tests only use
// the returned role sets, so the platform's are handed back right away
const configureRoles = (options: Parameters<typeof roles.configureRoles>[0]) => {
  const restoreRoles = roles.snapshotConfiguredRoles();
  try {
    return roles.configureRoles(options);
  } finally {
    restoreRoles();
  }
};

registerEvents(['ACL_DENIED']);
const permissions = configureRoles({
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

test('scanners see active events and ticket holders but no private user data, and cannot export, cancel or reimburse', async () => {
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

// Two organizers share the platform; each event carries its organizer as tag.
const ownEvent = { _id: 'own', type: 'TOKENIZED_PRODUCT', status: 'ACTIVE', tags: ['organizer:a'] };
const foreignEvent = {
  _id: 'foreign',
  type: 'TOKENIZED_PRODUCT',
  status: 'ACTIVE',
  tags: ['organizer:b'],
};
const organizerTickets = [
  { _id: 'own-ticket', productId: ownEvent._id, userId: 'buyer', tokenSerialNumber: '1' },
  { _id: 'foreign-ticket', productId: foreignEvent._id, userId: 'buyer', tokenSerialNumber: '1' },
];

function createScopedPlatform() {
  const asked: string[] = [];
  // Staff roles name their organizer: organizer:a may only work with events tagged organizer:a.
  const canAccessEvent = (product: any, context: any) => {
    asked.push(`${context.userId}:${product._id}`);
    const organizers = context.user.roles.filter((role: string) => role.startsWith('organizer:'));
    return product.tags.some((tag: string) => organizers.includes(tag));
  };
  const scopedPermissions = configureRoles({
    additionalActions: ticketingActions,
    additionalRoles: {
      ticketing: createTicketingRoles({ canAccessEvent }),
      'organizer:a': (role: any, actions: Record<string, string>) =>
        role.allow(actions.cancelTicket, () => true),
      'organizer:b': (role: any, actions: Record<string, string>) =>
        role.allow(actions.cancelTicket, () => true),
      manager: (role: any, actions: Record<string, string>) =>
        role.allow(actions.manageProducts, () => true),
    },
  });
  const products = [ownEvent, foreignEvent];
  const cancelled: string[] = [];
  const contextFor = (user?: { _id: string; roles: string[]; guest?: boolean }) =>
    ({
      userId: user?._id,
      user,
      roles: scopedPermissions,
      getHeader: () => undefined,
      services: {
        warehousing: { isTokenInvalidateable: async () => true },
        ticketing: {
          cancelTicketWithDiscount: async (tokenId: string) => {
            cancelled.push(tokenId);
            return {
              token: { ...organizerTickets.find((t) => t._id === tokenId), meta: { cancelled: true } },
            };
          },
          cancelTicketsForProduct: async (productId: string) => {
            cancelled.push(productId);
            return { cancelledCount: 1 };
          },
        },
      },
      loaders: {
        productLoader: {
          load: async ({ productId }: any) => products.find((p) => p._id === productId) || null,
        },
      },
      modules: {
        passes: { cancelTicket: async () => null },
        orders: { findOrder: async () => null },
        products: {
          findProduct: async ({ productId }: any) => products.find((p) => p._id === productId) || null,
          findProducts: async ({ limit, offset = 0 }: any) =>
            products.slice(offset, limit ? offset + limit : undefined),
          count: async () => products.length,
          update: async () => undefined,
        },
        warehousing: {
          findToken: async ({ tokenId }: any) => organizerTickets.find((t) => t._id === tokenId) || null,
          findTokens: async (selector: any) =>
            organizerTickets.filter(
              (t) =>
                t.productId === selector.productId &&
                (!selector.tokenSerialNumber || t.tokenSerialNumber === selector.tokenSerialNumber),
            ),
          invalidateToken: async (tokenId: string) => ({
            ...organizerTickets.find((t) => t._id === tokenId),
            invalidatedDate: new Date(),
          }),
          allProviders: async () => [],
        },
      },
    }) as any;
  return { permissions: scopedPermissions, contextFor, asked, cancelled };
}

test('an organizer scope narrows gate staff to their own events', async () => {
  const { permissions: scoped, contextFor, asked } = createScopedPlatform();
  const staff = contextFor({ _id: 'gate-a', roles: ['ticketing', 'organizer:a'] });
  const can = (action: string, args: any[] = []) => scoped.userHasPermission(staff, action, args as any);

  assert.equal(await can('gateControl'), true, 'Gate Control stays reachable');
  assert.equal(await can('gateControl', [ownEvent, {}]), true);
  assert.equal(await can('gateControl', [foreignEvent, {}]), false);
  assert.equal(await can('viewTokens', [ownEvent, {}]), true);
  assert.equal(await can('viewTokens', [foreignEvent, {}]), false);

  const { Query, Mutation } = ticketingResolvers as any;
  assert.deepEqual(
    (await Query.ticketEvents(undefined, {}, staff)).map(({ _id }: any) => _id),
    ['own'],
  );
  assert.deepEqual(
    (await Query.ticketEvents(undefined, { limit: 1, offset: 0 }, staff)).map(({ _id }: any) => _id),
    ['own'],
  );
  assert.equal(await Query.ticketEventsCount(undefined, {}, staff), 1);
  assert.deepEqual(
    (await Query.ticketLookup(undefined, { code: 'own-ticket' }, staff)).map(({ _id }: any) => _id),
    ['own-ticket'],
  );
  assert.deepEqual(await Query.ticketLookup(undefined, { code: 'foreign-ticket' }, staff), []);
  assert.deepEqual(
    await Query.ticketLookup(undefined, { code: '1', productId: foreignEvent._id }, staff),
    [],
  );

  await assert.rejects(
    Mutation.scanTicket(undefined, { tokenId: 'foreign-ticket' }, staff),
    /permission/i,
  );
  assert.ok((await Mutation.scanTicket(undefined, { tokenId: 'own-ticket' }, staff)).invalidatedDate);
  assert.ok(asked.every((entry) => entry.startsWith('gate-a:')));
});

test('a role granted cancelTicket only cancels within its organizer scope', async () => {
  const { contextFor, cancelled } = createScopedPlatform();
  const organizer = contextFor({ _id: 'organizer-a', roles: ['organizer:a'] });
  const { Mutation } = ticketingResolvers as any;
  for (const cancel of [
    Mutation.cancelTicket(undefined, { tokenId: 'foreign-ticket' }, organizer),
    Mutation.cancelEvent(undefined, { productId: foreignEvent._id }, organizer),
  ]) {
    await assert.rejects(cancel, /permission/i);
  }
  assert.deepEqual(cancelled, []);
  await Mutation.cancelTicket(undefined, { tokenId: 'own-ticket' }, organizer);
  await Mutation.cancelEvent(undefined, { productId: ownEvent._id }, organizer);
  assert.deepEqual(cancelled, ['own-ticket', 'own']);
});

test('an organizer scope never widens access and leaves administrators alone', async () => {
  const { permissions: scoped, contextFor, asked } = createScopedPlatform();
  // The predicate accepts these users for organizer a, yet without ticketing access (an organizer
  // role only grants cancelTicket), as guest or anonymously they stay outside Gate Control.
  for (const user of [
    undefined,
    { _id: 'organizer-a', roles: ['organizer:a'] },
    { _id: 'guest', roles: ['ticketing', 'organizer:a'], guest: true },
  ]) {
    const denied = contextFor(user);
    for (const args of [[], [ownEvent, {}]]) {
      assert.equal(await scoped.userHasPermission(denied, 'gateControl', args as any), false);
    }
    assert.equal(await scoped.userHasPermission(denied, 'viewTokens', [ownEvent, {}]), false);
    await assert.rejects(
      (ticketingResolvers as any).Query.ticketLookup(undefined, { code: 'own-ticket' }, denied),
      /permission/i,
    );
  }

  const admin = contextFor({ _id: 'admin', roles: ['admin'] });
  const { Query, Mutation } = ticketingResolvers as any;
  assert.deepEqual(
    (await Query.ticketEvents(undefined, {}, admin)).map(({ _id }: any) => _id),
    ['own', 'foreign'],
  );
  assert.equal(await Query.ticketEventsCount(undefined, {}, admin), 2);
  assert.equal(await scoped.userHasPermission(admin, 'viewTokens', [foreignEvent, {}]), true);
  assert.deepEqual(
    (await Query.ticketLookup(undefined, { code: 'foreign-ticket' }, admin)).map(({ _id }: any) => _id),
    ['foreign-ticket'],
  );
  assert.ok(
    (await Mutation.scanTicket(undefined, { tokenId: 'foreign-ticket' }, admin)).invalidatedDate,
  );
  await Mutation.cancelEvent(undefined, { productId: foreignEvent._id }, admin);
  assert.deepEqual(asked, [], 'the scope is never asked for administrators');
});

test('the ticketing rules are registered once when the role configurator is reused', async () => {
  const configure = createTicketingRoles();
  const reused = configureRoles({
    additionalActions: ticketingActions,
    additionalRoles: { ticketing: configure, 'gate-staff': configure },
  });
  const once = configureRoles({
    additionalActions: ticketingActions,
    additionalRoles: { ticketing: configure },
  });
  const allRules = reused.allRole!.allowRules;
  assert.equal(allRules.gateControl.length, 1);
  assert.equal(allRules.viewTokens.length, once.allRole!.allowRules.viewTokens.length);
  const staff = { ...createContext({ _id: 'gate', roles: ['gate-staff'] }), roles: reused };
  assert.equal(await reused.userHasPermission(staff, 'scanTicket', [undefined, {}]), true);
  assert.equal(await reused.userHasPermission(staff, 'viewTokens', [event, {}]), true);
});
