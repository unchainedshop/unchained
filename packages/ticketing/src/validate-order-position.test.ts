import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createTicketOrderPositionValidator,
  validateTicketOrderPosition,
} from './validate-order-position.ts';

const order = { _id: 'cart', status: null } as any;
const ticketProduct = (fields: Record<string, any> = {}) =>
  ({
    _id: 'event',
    type: 'TOKENIZED_PRODUCT',
    status: 'ACTIVE',
    tokenization: { supply: 10, contractStandard: 'ERC721' },
    ...fields,
  }) as any;

function createAPI({
  reserved = 0,
  positions = [] as { productId: string; quantity: number }[],
  proxy = null as any,
  passes = true,
} = {}) {
  const calls = { reserved: [] as any[], positions: 0, proxy: 0 };
  const api = {
    modules: {
      products: {
        isActive: (product: any) => product.status === 'ACTIVE',
        firstActiveProductProxy: async () => {
          calls.proxy += 1;
          return proxy;
        },
      },
      orders: {
        positions: {
          findOrderPositions: async ({ orderId }) => {
            assert.equal(orderId, order._id);
            calls.positions += 1;
            return positions;
          },
        },
      },
      passes: passes
        ? {
            countReservedTickets: async (params: any) => {
              calls.reserved.push(params);
              return reserved;
            },
          }
        : undefined,
    },
  } as any;
  return { api, calls };
}

const errorCode = (code: string) => (error: any) => error?.extensions?.code === code;

test('products that are not tickets only get the default check', async () => {
  const { api, calls } = createAPI();
  const simple = { _id: 'shirt', type: 'SIMPLE_PRODUCT', status: 'ACTIVE' };
  await validateTicketOrderPosition({ order, product: simple, quantityDiff: 1 }, api);
  await assert.rejects(
    validateTicketOrderPosition(
      { order, product: { ...simple, status: 'DRAFT' }, quantityDiff: 1 },
      api,
    ),
    /This product is inactive/,
  );
  await assert.rejects(
    validateTicketOrderPosition(
      { order, product: ticketProduct({ status: 'DRAFT' }), quantityDiff: 1 },
      api,
    ),
    /This product is inactive/,
  );
  assert.deepEqual(calls, { reserved: [], positions: 0, proxy: 0 });
});

test('tickets of a cancelled event cannot be added or checked out', async () => {
  const { api } = createAPI();
  const cancelled = ticketProduct({ meta: { cancelled: true } });
  for (const quantityDiff of [1, 0]) {
    await assert.rejects(
      validateTicketOrderPosition({ order, product: cancelled, quantityDiff }, api),
      errorCode('TicketEventCancelledError'),
    );
  }
});

test('the supply caps issued tickets, pending orders and this order together', async () => {
  const { api, calls } = createAPI({
    reserved: 6,
    positions: [
      { productId: 'event', quantity: 2 },
      { productId: 'event', quantity: 1 },
      { productId: 'other-event', quantity: 5 },
    ],
  });
  await validateTicketOrderPosition({ order, product: ticketProduct(), quantityDiff: 1 }, api);
  assert.deepEqual(calls.reserved, [{ productId: 'event', excludeOrderId: 'cart' }]);
  await assert.rejects(
    validateTicketOrderPosition({ order, product: ticketProduct(), quantityDiff: 2 }, api),
    (error: any) =>
      error.extensions.code === 'TicketSoldOutError' &&
      error.extensions.productId === 'event' &&
      error.extensions.available === 1,
  );
});

test('checkout validates the quantities already in the order', async () => {
  const { api } = createAPI({ reserved: 6, positions: [{ productId: 'event', quantity: 5 }] });
  await assert.rejects(
    validateTicketOrderPosition({ order, product: ticketProduct(), quantityDiff: 0 }, api),
    errorCode('TicketSoldOutError'),
  );
  const { api: enough } = createAPI({ reserved: 6, positions: [{ productId: 'event', quantity: 4 }] });
  await validateTicketOrderPosition({ order, product: ticketProduct(), quantityDiff: 0 }, enough);
});

test('events without a supply have no cap', async () => {
  const { api, calls } = createAPI({ reserved: 1000 });
  for (const tokenization of [undefined, { supply: 0 }, { supply: null }]) {
    await validateTicketOrderPosition(
      { order, product: ticketProduct({ tokenization }), quantityDiff: 50 },
      api,
    );
  }
  assert.deepEqual(calls.reserved, []);
  assert.equal(calls.positions, 0);
});

test('reducing the quantity is never blocked by the supply or the sale rules', async () => {
  const getSaleRules = () => ({ onSale: false });
  const validate = createTicketOrderPositionValidator({ getSaleRules });
  const { api } = createAPI({ reserved: 20, positions: [{ productId: 'event', quantity: 3 }] });
  await validate({ order, product: ticketProduct(), quantityDiff: -1 }, api);
});

test('without the passes module the supply cannot be checked', async () => {
  const { api } = createAPI({ passes: false });
  await assert.rejects(
    validateTicketOrderPosition({ order, product: ticketProduct(), quantityDiff: 1 }, api),
    errorCode('TicketingModuleNotFoundError'),
  );
});

test('sale rules close, open and limit the sale of an event', async () => {
  const hour = 3_600_000;
  const product = ticketProduct();
  const cases: [Record<string, any> | null | undefined, number, string | null][] = [
    [null, 1, null],
    [undefined, 1, null],
    [{}, 1, null],
    [{ onSale: false }, 1, 'TicketNotOnSaleError'],
    [{ onSale: true }, 1, null],
    [{ salesStart: new Date(Date.now() + hour) }, 1, 'TicketSaleNotStartedError'],
    [{ salesStart: new Date(Date.now() - hour).toISOString() }, 1, null],
    [{ salesEnd: new Date(Date.now() - hour).toISOString() }, 1, 'TicketSaleEndedError'],
    [{ salesEnd: new Date(Date.now() + hour), salesStart: null }, 1, null],
    [{ salesStart: 'soon' }, 1, 'TicketNotOnSaleError'],
    [{ maxPerOrder: 4 }, 1, null],
    [{ maxPerOrder: 4 }, 2, 'TicketOrderLimitExceededError'],
    [{ maxPerOrder: 3 }, 0, null],
    [{ maxPerOrder: null }, 7, null],
  ];
  for (const [rules, quantityDiff, expectedCode] of cases) {
    const { api } = createAPI({ positions: [{ productId: 'event', quantity: 3 }] });
    const validate = createTicketOrderPositionValidator({ getSaleRules: () => rules as any });
    const validation = validate({ order, product, quantityDiff }, api);
    const label = JSON.stringify({ rules, quantityDiff });
    if (expectedCode) await assert.rejects(validation, errorCode(expectedCode), label);
    else await assert.doesNotReject(validation, label);
  }
});

test('sale rules receive the order, the quantity change and a lazy proxy lookup', async () => {
  const proxy = { _id: 'show', meta: { presaleStart: '2020-01-01' } };
  const { api, calls } = createAPI({ proxy });
  const received: any[] = [];
  const validate = createTicketOrderPositionValidator({
    getSaleRules: async (input, unchainedAPI) => {
      received.push({ ...input, unchainedAPI });
      if (input.quantityDiff === 1) return {};
      const first = await input.getProxy();
      const second = await input.getProxy();
      assert.equal(first, second);
      return { onSale: Boolean(first?.meta?.presaleStart) };
    },
  });
  await validate({ order, product: ticketProduct(), quantityDiff: 1 }, api);
  assert.equal(calls.proxy, 0);
  await validate({ order, product: ticketProduct(), quantityDiff: 2 }, api);
  assert.equal(calls.proxy, 1);
  assert.equal(received[0].order, order);
  assert.equal(received[0].product._id, 'event');
  assert.equal(received[0].unchainedAPI, api);

  // Sale rules only apply to tickets.
  await validate({ order, product: { _id: 'shirt', type: 'SIMPLE_PRODUCT', status: 'ACTIVE' } }, api);
  assert.equal(received.length, 2);
});

test('validateTicketOrderPosition applies the stored sale rules of the performance and its production', async () => {
  const production = {
    _id: 'show',
    type: 'CONFIGURABLE_PRODUCT',
    tags: ['ticket-production'],
    meta: { saleRules: { onSale: false } },
  };
  const { api } = createAPI({ proxy: production });
  await assert.rejects(
    validateTicketOrderPosition({ order, product: ticketProduct(), quantityDiff: 1 }, api),
    errorCode('TicketNotOnSaleError'),
  );
  // The performance opens its own sale
  await validateTicketOrderPosition(
    { order, product: ticketProduct({ meta: { saleRules: { onSale: true } } }), quantityDiff: 1 },
    api,
  );
  // A standalone event reads its own rules
  const { api: standalone } = createAPI();
  await assert.rejects(
    validateTicketOrderPosition(
      { order, product: ticketProduct({ meta: { saleRules: { maxPerOrder: 0 } } }), quantityDiff: 1 },
      standalone,
    ),
    errorCode('TicketOrderLimitExceededError'),
  );
});

test('getSaleRules: null switches the sale rules off', async () => {
  const validate = createTicketOrderPositionValidator({ getSaleRules: null });
  const { api } = createAPI();
  await validate(
    { order, product: ticketProduct({ meta: { saleRules: { onSale: false } } }), quantityDiff: 1 },
    api,
  );
});
