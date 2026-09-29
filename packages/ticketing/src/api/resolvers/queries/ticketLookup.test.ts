import { test } from 'node:test';
import assert from 'node:assert/strict';
import ticketLookup from './ticketLookup.ts';

const events = [
  { _id: 'event', type: 'TOKENIZED_PRODUCT', status: 'ACTIVE' },
  { _id: 'other-event', type: 'TOKENIZED_PRODUCT', status: 'ACTIVE' },
  { _id: 'draft', type: 'TOKENIZED_PRODUCT', status: null },
];
const tickets = [
  {
    _id: 'a1b2c3',
    productId: 'event',
    tokenSerialNumber: '12',
    orderPositionId: 'position',
    meta: { attendeeName: 'Anna Muster' },
  },
  {
    _id: 'd4e5f6',
    productId: 'event',
    tokenSerialNumber: '13',
    orderPositionId: 'position',
    meta: { attendeeName: 'Bruno Beispiel', cancelled: true },
  },
  {
    _id: 'g7h8i9',
    productId: 'other-event',
    tokenSerialNumber: '12',
    orderPositionId: 'other-position',
    meta: { attendeeName: 'Anna Andere' },
  },
  {
    _id: 'j1k2l3',
    productId: 'draft',
    tokenSerialNumber: '12',
    orderPositionId: 'position',
    meta: { attendeeName: 'Anna Entwurf' },
  },
  {
    _id: 'm4n5o6',
    productId: 'event',
    tokenSerialNumber: '14',
    orderPositionId: 'x',
    meta: { attendeeName: 'A.B. Punkt' },
  },
];

const matches = (token: any, selector: Record<string, any>) =>
  Object.entries(selector).every(([key, condition]) => {
    const value = key === 'meta.attendeeName' ? token.meta?.attendeeName : token[key];
    if (condition?.$in) return condition.$in.includes(value);
    if (condition?.$regex) return new RegExp(condition.$regex, condition.$options).test(value ?? '');
    return value === condition;
  });

function createContext(canManageProducts = false) {
  const tokenQueries: any[] = [];
  const context = {
    userId: 'scanner',
    user: { _id: 'scanner' },
    roles: {
      userHasPermission: async (_context: any, action: string) =>
        action === 'scanTicket' || (canManageProducts && action === 'manageProducts'),
    },
    loaders: {
      productLoader: { load: async ({ productId }: any) => events.find((e) => e._id === productId) },
    },
    modules: {
      orders: {
        findOrder: async ({ orderNumber }: any) =>
          orderNumber === 'R-1001' ? { _id: 'order', orderNumber } : null,
        positions: {
          findOrderPositions: async ({ orderId }: any) =>
            orderId === 'order' ? [{ _id: 'position' }, { _id: 'other-position' }] : [],
        },
      },
      warehousing: {
        findToken: async ({ tokenId }: any) => tickets.find((t) => t._id === tokenId) || null,
        findTokens: async (selector: any, options: any = {}) => {
          tokenQueries.push({ selector, options });
          return tickets.filter((t) => matches(t, selector)).slice(0, options.limit);
        },
      },
    },
  } as any;
  return { context, tokenQueries };
}

const lookup = async (args: { code: string; productId?: string; limit?: number }, canManage = false) => {
  const { context } = createContext(canManage);
  const found = await ticketLookup(undefined as never, args, context);
  return found.map(({ _id }: any) => _id);
};

test('a ticket is found by its id, typed or inside any scanned QR payload', async () => {
  for (const code of [
    'a1b2c3',
    '  a1b2c3 ',
    'https://shop.example/download/a1b2c3?hash=abc',
    'https://engine.example/rest/apple-wallet/download/a1b2c3.pkpass?hash=abc',
    'unchained-scanner://a1b2c3?hash=abc',
    'unchained://ticket/a1b2c3?hash=abc',
  ]) {
    assert.deepEqual(await lookup({ code }), ['a1b2c3'], code);
  }
  // Tickets of other events are returned too, the gate tells them apart by their product.
  assert.deepEqual(await lookup({ code: 'g7h8i9', productId: 'event' }), ['g7h8i9']);
  assert.deepEqual(await lookup({ code: '' }), []);
});

test('serials and attendee names are searched within the event, order numbers across events', async () => {
  assert.deepEqual(await lookup({ code: '12', productId: 'event' }), ['a1b2c3']);
  assert.deepEqual(await lookup({ code: '#13', productId: 'event' }), ['d4e5f6']);
  assert.deepEqual(await lookup({ code: '12' }), [], 'serials repeat across events');
  assert.deepEqual(await lookup({ code: 'anna', productId: 'event' }), ['a1b2c3']);
  assert.deepEqual(await lookup({ code: 'BEISPIEL', productId: 'event' }), ['d4e5f6']);
  assert.deepEqual(await lookup({ code: 'anna' }), [], 'names are only searched within an event');
  // The name is matched literally, not as a pattern.
  assert.deepEqual(await lookup({ code: 'A.B.', productId: 'event' }), ['m4n5o6']);
  assert.deepEqual(await lookup({ code: 'A.*', productId: 'event' }), []);
  assert.deepEqual(await lookup({ code: 'R-1001' }), ['a1b2c3', 'd4e5f6', 'g7h8i9']);
  assert.deepEqual(await lookup({ code: 'R-1001', limit: 2 }), ['a1b2c3', 'd4e5f6']);
});

test('gate staff only find tickets of active events, product managers those of drafts as well', async () => {
  assert.deepEqual(await lookup({ code: 'j1k2l3' }), []);
  assert.deepEqual(await lookup({ code: '12', productId: 'draft' }), []);
  assert.deepEqual(await lookup({ code: 'j1k2l3' }, true), ['j1k2l3']);
  assert.deepEqual(await lookup({ code: '12', productId: 'draft' }, true), ['j1k2l3']);
  assert.deepEqual(await lookup({ code: 'R-1001' }, true), ['a1b2c3', 'd4e5f6', 'g7h8i9', 'j1k2l3']);
});

test('lookups are bounded', async () => {
  const { context, tokenQueries } = createContext();
  await ticketLookup(undefined as never, { code: 'R-1001', productId: 'event', limit: 5000 }, context);
  assert.ok(tokenQueries.length);
  for (const { options } of tokenQueries) assert.ok(options.limit > 0 && options.limit <= 100);
});
