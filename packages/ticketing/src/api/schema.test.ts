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
  for (const field of ['ticketEvents', 'ticketEventsCount', 'isPassCodeValid']) {
    assert.equal(core.getQueryType()!.getFields()[field], undefined);
  }
  for (const field of [
    'scanTicket',
    'cancelTicket',
    'cancelEvent',
    'authenticateGate',
    'deauthenticateGate',
    'setEventScannerPassCode',
  ]) {
    assert.equal(core.getMutationType()!.getFields()[field], undefined);
  }
  for (const name of ['Token', 'TokenizedProduct']) {
    assert.equal((core.getType(name) as GraphQLObjectType).getFields().isCanceled, undefined);
  }
  const extended = makeExecutableSchema({
    typeDefs: [...coreTypes, ...ticketingTypeDefs],
    resolvers: [coreResolvers, ticketingResolvers],
  });
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

test('GraphQL lets scanner staff list attendees and redeem without exposing user accounts or access keys', async () => {
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
  const token: any = { _id: 'ticket', productId: event._id, userId: buyer._id };
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
        findToken: async () => token,
        buildAccessKeyFromToken: async () => 'secret',
        invalidateToken: async () => {
          token.invalidatedDate = new Date();
          return token;
        },
      },
      users: { primaryEmail: () => undefined },
      payment: {
        paymentCredentials: {
          findPaymentCredentials: async () => [{ _id: 'card', token: { alias: 'stored-card' } }],
        },
      },
    },
    loaders: { userLoader: { load: async () => buyer }, productLoader: { load: async () => event } },
    services: { warehousing: { isTokenInvalidateable: async () => !token.invalidatedDate } },
  };
  const query =
    '{ ticketEvents { _id ... on TokenizedProduct { tokens { _id attendee { name email phone } } } } }';
  const list = await graphql({ schema, source: query, contextValue: context });
  assert.equal(list.errors, undefined);
  assert.deepEqual(
    { ...(list.data as any).ticketEvents[0].tokens[0].attendee },
    {
      name: 'Buyer',
      email: 'buyer@example.com',
      phone: '+41790000000',
    },
  );
  // Gate staff get the attendee contact, not the ticket holder's account.
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
  const mutation = 'mutation { scanTicket(tokenId: "ticket") { _id invalidatedDate isInvalidateable } }';
  const scanned = await graphql({ schema, source: mutation, contextValue: context });
  assert.equal(scanned.errors, undefined);
  assert.equal((scanned.data as any).scanTicket.isInvalidateable, false);
  const repeated = await graphql({ schema, source: mutation, contextValue: context });
  assert.ok(repeated.errors?.length);
  const keys = await graphql({
    schema,
    source: '{ ticketEvents { ... on TokenizedProduct { tokens { accessKey } } } }',
    contextValue: context,
  });
  assert.match(keys.errors![0].message, /permission/i);
  const anonymous = { ...context, userId: undefined, user: undefined };
  const denied = await graphql({ schema, source: query, contextValue: anonymous });
  assert.match(denied.errors![0].message, /permission/i);
});
