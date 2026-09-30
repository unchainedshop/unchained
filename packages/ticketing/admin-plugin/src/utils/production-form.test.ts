import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  centsToDecimal,
  emptyProductionFormValues,
  fromTicketSaleRules,
  toCents,
  toCreateTicketProductionInput,
  toTicketSaleRulesInput,
} from './production-form.ts';

const shop = { locale: 'de', currencyCode: 'CHF', countryCode: 'CH' };

test('prices are entered as decimals and stored in cents', () => {
  assert.equal(toCents('45'), 4500);
  assert.equal(toCents('45.5'), 4550);
  assert.equal(toCents(' 45.05 '), 4505);
  assert.equal(toCents('0'), 0);
  assert.equal(toCents(''), null);
  assert.ok(Number.isNaN(toCents('45,-')));
  assert.ok(Number.isNaN(toCents('-5')));
  assert.equal(centsToDecimal(4550), '45.50');
  assert.equal(centsToDecimal(null), '');
});

test('the sale rules form keeps unset rules unset, inherit clears them', () => {
  const values = fromTicketSaleRules({
    onSale: false,
    salesStart: '2026-10-01T08:00:00.000Z',
    salesEnd: null,
    maxPerOrder: 4,
  });
  assert.equal(values.onSale, 'closed');
  assert.equal(values.maxPerOrder, '4');
  assert.equal(values.salesEnd, '');
  assert.deepEqual(toTicketSaleRulesInput(values), {
    input: {
      onSale: false,
      salesStart: new Date(values.salesStart).toISOString(),
      salesEnd: null,
      maxPerOrder: 4,
    },
  });
  assert.deepEqual(
    toTicketSaleRulesInput({ onSale: 'inherit', salesStart: '', salesEnd: '', maxPerOrder: '' }),
    { input: { onSale: null, salesStart: null, salesEnd: null, maxPerOrder: null } },
  );
  assert.deepEqual(
    toTicketSaleRulesInput({ onSale: 'open', salesStart: 'soon', salesEnd: '', maxPerOrder: '1.5' }),
    { errors: ['saleRules.salesStart', 'saleRules.maxPerOrder'] },
  );
});

test('a new production with categories becomes one createTicketProduction input', () => {
  const values = {
    ...emptyProductionFormValues(),
    title: ' Hamlet ',
    subtitle: 'Tragödie',
    tags: 'organizer-a, Festival',
    location: 'Grosse Bühne',
    durationMinutes: '150',
    categories: [
      { code: 'adult', name: 'Erwachsene', capacity: '100', price: '45' },
      { code: 'reduced', name: 'Ermässigt', capacity: '20', price: '25.50' },
    ],
    performances: [{ startsAt: '2026-11-01T20:00', supply: '', price: '' }],
  };
  const result = toCreateTicketProductionInput(values, shop);
  assert.ok('input' in result);
  assert.deepEqual(result.input, {
    texts: [{ locale: 'de', title: 'Hamlet', subtitle: 'Tragödie' }],
    tags: ['organizer-a', 'festival'],
    location: 'Grosse Bühne',
    durationMinutes: 150,
    saleRules: {},
    categories: [
      {
        code: 'adult',
        texts: [{ locale: 'de', title: 'Erwachsene' }],
        capacity: 100,
        pricing: [{ amount: 4500, currencyCode: 'CHF', countryCode: 'CH' }],
      },
      {
        code: 'reduced',
        texts: [{ locale: 'de', title: 'Ermässigt' }],
        capacity: 20,
        pricing: [{ amount: 2550, currencyCode: 'CHF', countryCode: 'CH' }],
      },
    ],
    performances: [{ startsAt: new Date('2026-11-01T20:00').toISOString() }],
  });
});

test('without categories each date carries its own supply and price', () => {
  const result = toCreateTicketProductionInput(
    {
      ...emptyProductionFormValues(),
      title: 'Kochkurs',
      performances: [{ startsAt: '2026-11-01T18:00', supply: '12', price: '90' }],
    },
    shop,
  );
  assert.ok('input' in result);
  assert.deepEqual(result.input.performances, [
    {
      startsAt: new Date('2026-11-01T18:00').toISOString(),
      tickets: [{ supply: 12, pricing: [{ amount: 9000, currencyCode: 'CHF', countryCode: 'CH' }] }],
    },
  ]);
  assert.equal(result.input.categories, undefined);
});

test('invalid fields are named instead of building an input', () => {
  const result = toCreateTicketProductionInput(
    {
      ...emptyProductionFormValues(),
      title: '',
      durationMinutes: 'long',
      categories: [
        { code: 'Adult Price', name: '', capacity: '-1', price: 'x' },
        { code: 'ok', name: '', capacity: '', price: '' },
        { code: 'ok', name: '', capacity: '', price: '' },
      ],
      performances: [{ startsAt: '', supply: '', price: '' }],
    },
    shop,
  );
  assert.deepEqual(result, {
    errors: [
      'title',
      'durationMinutes',
      'categories.0.code',
      'categories.0.capacity',
      'categories.0.price',
      'categories.2.code',
      'performances.0.startsAt',
    ],
  });
});
