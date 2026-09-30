import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getDefaultTicketSaleRules, mergeTicketSaleRules, readTicketSaleRules } from './sale-rules.ts';
import { TICKET_PRODUCTION_TAG } from './production.ts';

const salesStart = new Date('2026-10-01T08:00:00.000Z');

test('the sale rules of a product are read from meta.saleRules, unset rules are left out', () => {
  assert.deepEqual(readTicketSaleRules(undefined), {});
  assert.deepEqual(readTicketSaleRules({}), {});
  assert.deepEqual(readTicketSaleRules({ saleRules: null }), {});
  assert.deepEqual(
    readTicketSaleRules({
      saleRules: { onSale: false, salesStart, salesEnd: null, maxPerOrder: 4, other: 'x' },
      location: 'Hall',
    }),
    { onSale: false, salesStart, maxPerOrder: 4 },
  );
});

test('rules set on a performance win over the defaults of its production', () => {
  assert.deepEqual(
    mergeTicketSaleRules({ onSale: true, salesStart, maxPerOrder: 6 }, { maxPerOrder: 2 }),
    { onSale: true, salesStart, maxPerOrder: 2 },
  );
  assert.deepEqual(mergeTicketSaleRules({ onSale: true }, {}), { onSale: true });
  assert.deepEqual(mergeTicketSaleRules({}, { onSale: false }), { onSale: false });
});

test('the default rules merge the production rules only for performances of a production', async () => {
  const performance = { _id: 'p', meta: { saleRules: { maxPerOrder: 2 } } } as any;
  const production = {
    _id: 'show',
    tags: [TICKET_PRODUCTION_TAG],
    meta: { saleRules: { salesStart, maxPerOrder: 6 } },
  } as any;
  let lookups = 0;
  const getProxy = (proxy: any) => async () => {
    lookups += 1;
    return proxy;
  };

  assert.deepEqual(
    await getDefaultTicketSaleRules({ product: performance, getProxy: getProxy(production) }),
    {
      salesStart,
      maxPerOrder: 2,
    },
  );
  // Any other configurable product is not a production: its meta is not read as sale rules
  const proxy = { ...production, tags: ['ticket-proxy'] };
  assert.deepEqual(
    await getDefaultTicketSaleRules({ product: performance, getProxy: getProxy(proxy) }),
    {
      maxPerOrder: 2,
    },
  );
  assert.deepEqual(await getDefaultTicketSaleRules({ product: performance, getProxy: getProxy(null) }), {
    maxPerOrder: 2,
  });

  // Every rule set on the product: the production is not looked up
  lookups = 0;
  const complete = {
    _id: 'p',
    meta: { saleRules: { onSale: true, salesStart, salesEnd: salesStart, maxPerOrder: 1 } },
  } as any;
  await getDefaultTicketSaleRules({ product: complete, getProxy: getProxy(production) });
  assert.equal(lookups, 0);
});
