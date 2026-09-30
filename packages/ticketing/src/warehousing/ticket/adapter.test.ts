import { test } from 'node:test';
import assert from 'node:assert/strict';
import { WarehousingError } from '@unchainedshop/core';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient } from 'mongodb';
import ticketingModules from '../../module.ts';
import TicketWarehousingPluginDefault, {
  TicketWarehousingPlugin,
  createTicketWarehousingPlugin,
} from './index.ts';
import { createTicketWarehousingAdapter } from './adapter.ts';

const HOUR = 3_600_000;
const now = new Date('2026-10-01T12:00:00.000Z');
const inHours = (hours: number) => new Date(now.getTime() + hours * HOUR);

const defaultConfiguration = createTicketWarehousingAdapter().initialConfiguration;

const event = (fields: Record<string, any> = {}) => ({
  _id: 'event',
  type: 'TOKENIZED_PRODUCT',
  status: 'ACTIVE',
  tokenization: { supply: 10, contractStandard: 'ERC721' },
  ...fields,
});

const startingAt = (start: Date | string | undefined, fields: Record<string, any> = {}) =>
  event({
    meta: { slot: start },
    ...fields,
  });

function createModules(overrides: Record<string, any> = {}) {
  const calls: Record<string, any[]> = { countIssuedTickets: [], reserveTicketSerials: [] };
  let nextSerial = 5;
  const modules = {
    passes: {
      countIssuedTickets: async (...args: any[]) => {
        calls.countIssuedTickets.push(args);
        return overrides.issued ?? 0;
      },
      reserveTicketSerials: async (productId: string, count: number, options: any) => {
        calls.reserveTicketSerials.push([productId, count, options]);
        return Array.from({ length: count }, () => String(nextSerial++));
      },
    },
    products: {
      media: { findProductMedias: async () => [] },
      texts: {
        findLocalizedText: async () => ({ title: 'Premiere', description: 'Opening night' }),
      },
    },
    languages: { findLanguages: async () => [] },
    files: { findFile: async () => null },
    ...overrides.modules,
  };
  return { modules, calls };
}

function actionsFor(
  context: Record<string, any>,
  {
    configuration = defaultConfiguration,
    options = {},
  }: { configuration?: { key: string; value: string }[]; options?: any } = {},
) {
  const adapter = createTicketWarehousingAdapter(options);
  return adapter.actions(configuration, context as any);
}

const configure = (values: Record<string, string>) =>
  defaultConfiguration.map(({ key, value }) => ({ key, value: values[key] ?? value }));

test('the ticket issuer is a VIRTUAL warehousing plugin for tokenized products', () => {
  assert.equal(TicketWarehousingPluginDefault, TicketWarehousingPlugin);
  const plugin = createTicketWarehousingPlugin();
  assert.equal(plugin.key, 'shop.unchained.warehousing.ticket');
  const [adapter] = plugin.adapters as any[];
  assert.equal(adapter.key, 'shop.unchained.warehousing.ticket');
  assert.equal(adapter.label, 'Ticket Issuer');
  assert.equal(adapter.typeSupported('VIRTUAL'), true);
  assert.equal(adapter.typeSupported('PHYSICAL'), false);
  assert.deepEqual(adapter.initialConfiguration, [
    { key: 'entryOpensMinutesBefore', value: '120' },
    { key: 'entryClosesMinutesAfter', value: '60' },
    { key: 'serialOffset', value: '0' },
  ]);

  const { modules } = createModules();
  assert.equal(actionsFor({ product: event(), modules }).isActive(), true);
  assert.equal(
    actionsFor({ product: { ...event(), type: 'SIMPLE_PRODUCT' }, modules }).isActive(),
    false,
  );
  assert.equal(actionsFor({ modules }).isActive(), false);
});

test('tickets need no NFT fields, but the passes module and a readable configuration', () => {
  const { modules } = createModules();
  const offChain = event({ tokenization: { supply: 5 } });
  assert.equal(actionsFor({ product: offChain, modules }).configurationError(), null);
  assert.equal(
    actionsFor({ product: offChain, modules: { ...modules, passes: undefined } }).configurationError(),
    WarehousingError.INCOMPLETE_CONFIGURATION,
  );
  for (const key of ['entryOpensMinutesBefore', 'entryClosesMinutesAfter', 'serialOffset']) {
    assert.equal(
      actionsFor(
        { product: offChain, modules },
        { configuration: configure({ [key]: 'two hours' }) },
      ).configurationError(),
      WarehousingError.INCOMPLETE_CONFIGURATION,
      key,
    );
  }
});

test('stock is the supply minus the tickets that are not cancelled', async () => {
  const { modules, calls } = createModules({ issued: 4 });
  assert.equal(await actionsFor({ product: event(), modules }).stock(now), 6);
  assert.deepEqual(calls.countIssuedTickets, [['event', { skipCancelled: true }]]);

  const { modules: oversold } = createModules({ issued: 12 });
  assert.equal(await actionsFor({ product: event(), modules: oversold }).stock(now), 0);
  for (const tokenization of [undefined, { supply: 0 }]) {
    assert.equal(await actionsFor({ product: event({ tokenization }), modules }).stock(now), 0);
  }
  assert.equal(
    await actionsFor({ product: event({ meta: { cancelled: true } }), modules }).stock(now),
    0,
  );
});

test('redeemed and cancelled tickets and tickets of cancelled events cannot be redeemed', async () => {
  const { modules } = createModules();
  const product = startingAt(inHours(1));
  const token = { _id: 'ticket', tokenSerialNumber: '5', meta: {} };
  const redeemable = (context: Record<string, any>) =>
    actionsFor({ modules, product, token, ...context }).isInvalidateable('5', now);
  assert.equal(await redeemable({}), true);
  assert.equal(await redeemable({ token: { ...token, invalidatedDate: now } }), false);
  assert.equal(await redeemable({ token: { ...token, meta: { cancelled: true } } }), false);
  assert.equal(await redeemable({ product: { ...product, meta: { cancelled: true } } }), false);
});

test('tickets are redeemable within the configured entry window around the event start', async () => {
  const { modules } = createModules();
  const token = { _id: 'ticket', tokenSerialNumber: '5', meta: {} };
  const redeemable = (start: any, configuration?: Record<string, string>, fields = {}) =>
    actionsFor(
      { modules, token, product: startingAt(start, fields) },
      { configuration: configuration ? configure(configuration) : defaultConfiguration },
    ).isInvalidateable('5', now);

  // Default: from 120 minutes before until 60 minutes after the start.
  assert.equal(await redeemable(inHours(3)), false);
  assert.equal(await redeemable(inHours(2)), true);
  assert.equal(await redeemable(inHours(-1)), true);
  assert.equal(await redeemable(inHours(-1.5)), false);
  assert.equal(await redeemable(inHours(1).toISOString()), true);

  // TH opens eight hours before; an empty bound is unbounded.
  assert.equal(await redeemable(inHours(7), { entryOpensMinutesBefore: '480' }), true);
  assert.equal(await redeemable(inHours(72), { entryOpensMinutesBefore: '' }), true);
  assert.equal(await redeemable(inHours(-48), { entryClosesMinutesAfter: '' }), true);

  // Without a start the ticket is always redeemable; an unreadable start or bound never.
  assert.equal(await redeemable(undefined), true);
  assert.equal(await redeemable('next friday'), false);
  assert.equal(await redeemable(inHours(1), { entryClosesMinutesAfter: 'one hour' }), false);

  // A slot in the public tokenization properties is not the event start.
  const tokenSlot = event({
    tokenization: { supply: 10, ercMetadataProperties: { slot: inHours(5).toISOString() } },
  });
  assert.equal(await actionsFor({ modules, token, product: tokenSlot }).isInvalidateable('5', now), true);
});

test('every seat becomes its own ticket with a reserved serial and the order reference', async () => {
  const { modules, calls } = createModules();
  const order = { _id: 'order', userId: 'buyer', context: { attendees: ['Ada', 'Grace'] } };
  const orderPosition = { _id: 'position', orderId: 'order', productId: 'event', quantity: 2 };
  const hookCalls: any[] = [];
  const tokens = await actionsFor(
    { modules, order, orderPosition, product: event() },
    {
      configuration: configure({ serialOffset: '100' }),
      options: {
        ticketMeta: (input: any, unchainedAPI: any) => {
          hookCalls.push(input);
          assert.equal(unchainedAPI.modules, modules);
          return { attendeeName: input.order.context.attendees[input.index] };
        },
      },
    },
  ).tokenize();

  assert.deepEqual(calls.reserveTicketSerials, [['event', 2, { offset: 100 }]]);
  assert.deepEqual(
    tokens.map(({ tokenSerialNumber, quantity, meta }) => ({ tokenSerialNumber, quantity, meta })),
    [
      { tokenSerialNumber: '5', quantity: 1, meta: { attendeeName: 'Ada', orderId: 'order' } },
      { tokenSerialNumber: '6', quantity: 1, meta: { attendeeName: 'Grace', orderId: 'order' } },
    ],
  );
  assert.equal(new Set(tokens.map(({ _id }) => _id)).size, 2);
  tokens.forEach(({ _id }) => assert.match(_id!, /^[0-9a-f]{24}$/));
  assert.deepEqual(
    hookCalls.map(({ order: o, orderPosition: p, product, index }) => [
      o._id,
      p._id,
      product._id,
      index,
    ]),
    [
      ['order', 'position', 'event', 0],
      ['order', 'position', 'event', 1],
    ],
  );
});

test('the ticket meta hook can neither break issuing nor overwrite the reserved keys', async () => {
  const { modules } = createModules();
  const context = {
    modules,
    order: { _id: 'order' },
    orderPosition: { _id: 'position', orderId: 'order', productId: 'event', quantity: 1 },
    product: event(),
  };
  const issue = (ticketMeta: any) => actionsFor(context, { options: { ticketMeta } }).tokenize();

  const [overwriting] = await issue(() => ({
    orderId: 'forged',
    cancelled: true,
    cancelledDate: new Date(),
    seat: 'A1',
  }));
  assert.deepEqual(overwriting.meta, { seat: 'A1', orderId: 'order' });

  for (const broken of [
    () => {
      throw new Error('attendee form missing');
    },
    async () => Promise.reject(new Error('lookup failed')),
    () => undefined,
    () => 'Ada',
    () => ['Ada'],
  ]) {
    const [token] = await issue(broken);
    assert.deepEqual(token.meta, { orderId: 'order' });
  }

  await assert.rejects(actionsFor({ modules, product: event() }).tokenize(), /Order position not found/);
});

test('the public metadata only carries the ERC metadata properties, never the product or ticket meta', async () => {
  const { modules } = createModules();
  const metadata = await actionsFor({
    modules,
    product: event({
      meta: {
        slot: '2026-10-01T18:00:00.000Z',
        location: 'Main stage',
        category: null,
        cancelled: true,
        internalNote: 'not public',
      },
      tokenization: { supply: 10, contractStandard: 'ERC721', ercMetadataProperties: { seatMap: 'A' } },
    }),
    token: {
      _id: 'ticket',
      tokenSerialNumber: '5',
      meta: { orderId: 'order', attendeeName: 'Ada', cancelled: true },
    },
  }).tokenMetadata('5', now);
  assert.deepEqual(metadata, {
    name: 'Premiere #5',
    description: 'Opening night',
    image: undefined,
    properties: { seatMap: 'A' },
  });
});

test('concurrent checkouts get distinct serials from the passes module and reduce the stock', async () => {
  const server = await MongoMemoryServer.create();
  const client = new MongoClient(server.getUri());
  try {
    await client.connect();
    const db = client.db('ticket-issuer');
    const passes = await ticketingModules.passes.configure({ db, options: {} } as any);
    const { modules } = createModules();
    const product = event({ tokenization: { supply: 20 } });
    const tickets = await Promise.all(
      [1, 2, 3, 1, 2].map((quantity, index) =>
        actionsFor({
          modules: { ...modules, passes },
          product,
          order: { _id: `order-${index}` },
          orderPosition: { _id: `position-${index}`, orderId: `order-${index}`, quantity },
        }).tokenize(),
      ),
    );
    const issued = tickets.flat();
    assert.deepEqual(
      issued.map(({ tokenSerialNumber }) => Number(tokenSerialNumber)).sort((a, b) => a - b),
      Array.from({ length: 9 }, (_, index) => index + 1),
    );
    await db
      .collection<any>('token_surrogates')
      .insertMany(
        issued.map((ticket) => ({ ...ticket, productId: 'event', orderPositionId: 'position' })),
      );
    await passes.cancelTicket(issued[0]._id!);
    const actions = actionsFor({ modules: { ...modules, passes }, product });
    assert.equal(await actions.stock(now), 20 - 8);
  } finally {
    await client.close();
    await server.stop();
  }
});
