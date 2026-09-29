import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { graphql, parse, validate, type GraphQLObjectType } from 'graphql';
import { buildDefaultTypeDefs } from '@unchainedshop/api/lib/schema/index.js';
import coreResolvers from '@unchainedshop/api/lib/resolvers/index.js';
import { roles } from '@unchainedshop/api';
import { registerEvents } from '@unchainedshop/events';
import {
  ticketingTypeDefs,
  ticketingResolvers,
  ticketingActions,
  configureTicketingRoles,
} from './index.ts';

test('ticketing schema is optional and every plugin operation validates when installed', () => {
  const coreTypes = buildDefaultTypeDefs({ actions: Object.keys(roles.actions) });
  const core = makeExecutableSchema({ typeDefs: coreTypes });
  for (const field of ['ticketEvents', 'ticketEventsCount', 'ticketLookup', 'isPassCodeValid']) {
    assert.equal(core.getQueryType()!.getFields()[field], undefined);
  }
  for (const field of [
    'scanTicket',
    'cancelTicket',
    'cancelEvent',
    'updateTicketEvent',
    'authenticateGate',
    'deauthenticateGate',
    'setEventScannerPassCode',
  ]) {
    assert.equal(core.getMutationType()!.getFields()[field], undefined);
  }
  const ticketingFields = {
    Token: ['isCanceled', 'cancelledDate', 'ticketStatus', 'attendeeName'],
    TokenizedProduct: [
      'isCanceled',
      'eventStartsAt',
      'eventEndsAt',
      'eventDoorsOpenAt',
      'eventLocation',
      'eventCategory',
    ],
    Order: ['magicKey', 'ticketsPdfUrl'],
  };
  for (const [name, fields] of Object.entries(ticketingFields)) {
    for (const field of fields) {
      assert.equal((core.getType(name) as GraphQLObjectType).getFields()[field], undefined, field);
    }
  }
  const extended = makeExecutableSchema({
    typeDefs: [...coreTypes, ...ticketingTypeDefs],
    resolvers: [coreResolvers, ticketingResolvers],
  });
  for (const [name, fields] of Object.entries(ticketingFields)) {
    for (const field of fields) {
      assert.ok((extended.getType(name) as GraphQLObjectType).getFields()[field], field);
    }
  }
  assert.deepEqual(
    extended
      .getMutationType()!
      .getFields()
      .scanTicket.args.map(({ name }) => name),
    ['tokenId', 'productId', 'accessKey'],
  );
  for (const field of ['slotFrom', 'slotTo', 'tags']) {
    assert.ok(
      extended
        .getQueryType()!
        .getFields()
        .ticketEvents.args.some(({ name }) => name === field),
    );
    assert.ok(
      extended
        .getQueryType()!
        .getFields()
        .ticketEventsCount.args.some(({ name }) => name === field),
    );
  }
  assert.equal(extended.getQueryType()!.getFields().isPassCodeValid, undefined);
  for (const field of ['authenticateGate', 'deauthenticateGate', 'setEventScannerPassCode']) {
    assert.equal(extended.getMutationType()!.getFields()[field], undefined);
  }
  assert.equal(
    (extended.getType('TokenizedProduct') as GraphQLObjectType).getFields().scannerPassCode,
    undefined,
  );
  const hooks = new URL('../../admin-plugin/src/hooks/', import.meta.url);
  let operations = 0;
  for (const file of readdirSync(hooks).filter((name) => name.endsWith('.ts'))) {
    const source = readFileSync(new URL(file, hooks), 'utf8');
    for (const [, document] of source.matchAll(/gql`([\s\S]*?)`/g)) {
      assert.deepEqual(validate(extended, parse(document)), [], file);
      operations += 1;
    }
  }
  assert.ok(operations >= 7);
});

test('GraphQL lets scanner staff list attendees and redeem without exposing private user data or access keys', async () => {
  registerEvents(['ACL_DENIED']);
  const permissions = roles.configureRoles({
    additionalActions: ticketingActions,
    additionalRoles: { ticketing: configureTicketingRoles },
  });
  const schema = makeExecutableSchema({
    typeDefs: [...buildDefaultTypeDefs({ actions: ticketingActions }), ...ticketingTypeDefs],
    resolvers: [coreResolvers, ticketingResolvers],
  });
  const event = { _id: 'event', type: 'TOKENIZED_PRODUCT', status: 'ACTIVE' };
  const buyer = {
    _id: 'buyer',
    profile: { displayName: 'Buyer' },
    lastContact: { emailAddress: 'buyer@example.com', telNumber: '+41790000000' },
    lastBillingAddress: { firstName: 'Jane', lastName: 'Doe', addressLine: 'Secret 1' },
    services: { webAuthn: [{ id: 'credential' }] },
  };
  const token: any = {
    _id: 'ticket',
    productId: event._id,
    userId: buyer._id,
    tokenSerialNumber: '7',
    meta: { orderId: 'order', attendeeName: 'Anna Muster' },
  };
  const context = {
    userId: 'scanner',
    user: { _id: 'scanner', roles: ['ticketing'] },
    roles: permissions,
    getHeader: () => undefined,
    modules: {
      products: {
        findProducts: async () => [event],
        findProduct: async () => event,
      },
      warehousing: {
        findTokens: async () => [token],
        findToken: async ({ tokenId }: any) => (tokenId === token._id ? token : null),
        buildAccessKeyFromToken: async () => 'secret',
        invalidateToken: async () => {
          token.invalidatedDate = new Date();
          return token;
        },
        allProviders: async () => [],
      },
      orders: { findOrder: async () => null },
      payment: {
        paymentCredentials: {
          findPaymentCredentials: async () => [{ _id: 'card', token: { alias: 'stored-card' } }],
        },
      },
    },
    loaders: { userLoader: { load: async () => buyer }, productLoader: { load: async () => event } },
    services: { warehousing: { isTokenInvalidateable: async () => !token.invalidatedDate } },
  };
  const query = '{ ticketEvents { _id ... on TokenizedProduct { tokens { _id user { _id name } } } } }';
  const list = await graphql({ schema, source: query, contextValue: context });
  assert.equal(list.errors, undefined);
  assert.equal((list.data as any).ticketEvents[0].tokens[0].user.name, 'Buyer');
  // Gate staff see the ticket holder's public profile (viewUserPublicInfos), nothing private.
  for (const field of [
    'profile { displayName }',
    'primaryEmail { address }',
    'lastBillingAddress { addressLine }',
    'webAuthnCredentials { _id }',
    'paymentCredentials { _id token }',
  ]) {
    const exposed = await graphql({
      schema,
      source: `{ ticketEvents { ... on TokenizedProduct { tokens { user { _id ${field} } } } } }`,
      contextValue: context,
    });
    assert.match(exposed.errors?.[0]?.message ?? '', /permission/i, field);
  }
  // The attendee name stored with the ticket is visible at the gate, also through a lookup.
  const lookup = await graphql({
    schema,
    source: `{ ticketLookup(code: "https://shop.example/download/ticket?hash=secret") {
      _id tokenSerialNumber ticketStatus attendeeName user { _id name }
    } }`,
    contextValue: context,
  });
  assert.equal(lookup.errors, undefined);
  // GraphQL results have no prototype; compare their JSON.
  assert.deepEqual(JSON.parse(JSON.stringify(lookup.data)).ticketLookup, [
    {
      _id: 'ticket',
      tokenSerialNumber: '7',
      ticketStatus: 'VALID',
      attendeeName: 'Anna Muster',
      user: { _id: 'buyer', name: 'Buyer' },
    },
  ]);
  for (const field of ['primaryEmail { address }', 'lastBillingAddress { addressLine }']) {
    const exposed = await graphql({
      schema,
      source: `{ ticketLookup(code: "ticket") { attendeeName user { _id ${field} } } }`,
      contextValue: context,
    });
    assert.match(exposed.errors?.[0]?.message ?? '', /permission/i, field);
  }
  const edit = await graphql({
    schema,
    source: 'mutation { updateTicketEvent(productId: "event", event: { location: "Hall" }) { _id } }',
    contextValue: context,
  });
  assert.match(edit.errors![0].message, /permission/i, 'editing events needs manageProducts');

  const mutation =
    'mutation { scanTicket(tokenId: "ticket", productId: "event") { _id invalidatedDate isInvalidateable ticketStatus } }';
  const scanned = await graphql({ schema, source: mutation, contextValue: context });
  assert.equal(scanned.errors, undefined);
  assert.equal((scanned.data as any).scanTicket.isInvalidateable, false);
  assert.equal((scanned.data as any).scanTicket.ticketStatus, 'REDEEMED');
  const repeated = await graphql({ schema, source: mutation, contextValue: context });
  assert.equal(repeated.errors?.[0]?.extensions?.code, 'TicketAlreadyRedeemedError');
  assert.ok(repeated.errors?.[0]?.extensions?.invalidatedDate);
  const elsewhere = await graphql({
    schema,
    source: 'mutation { scanTicket(tokenId: "ticket", productId: "other-event") { _id } }',
    contextValue: context,
  });
  assert.equal(elsewhere.errors?.[0]?.extensions?.code, 'TicketWrongEventError');
  const keys = await graphql({
    schema,
    source: '{ ticketEvents { ... on TokenizedProduct { tokens { accessKey } } } }',
    contextValue: context,
  });
  assert.match(keys.errors![0].message, /permission/i);
  const anonymous = { ...context, userId: undefined, user: undefined };
  const denied = await graphql({ schema, source: query, contextValue: anonymous });
  assert.match(denied.errors![0].message, /permission/i);
  const deniedLookup = await graphql({
    schema,
    source: '{ ticketLookup(code: "ticket") { _id attendeeName } }',
    contextValue: anonymous,
  });
  assert.match(deniedLookup.errors![0].message, /permission/i);
});
