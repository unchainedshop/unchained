import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  centsToDecimal,
  emptyProductionFormValues,
  fromTicketSaleRules,
  toCents,
  toCreateTicketProductionInput,
  toTicketSaleRulesInput,
  toUpdateTicketProductionInput,
  performanceFormValues,
  toTicketPerformanceInput,
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

test('editing a production sends every text, detail and rule; blanks clear them', () => {
  const result = toUpdateTicketProductionInput(
    {
      title: 'Hamlet',
      subtitle: '',
      description: 'Neu',
      tags: 'organizer-a',
      location: '',
      durationMinutes: '150',
      doorsOpenMinutesBefore: '',
      saleRules: { onSale: 'open', salesStart: '', salesEnd: '', maxPerOrder: '6' },
    },
    shop,
  );
  assert.deepEqual(result, {
    input: {
      texts: [{ locale: 'de', title: 'Hamlet', subtitle: null, description: 'Neu' }],
      tags: ['organizer-a'],
      location: null,
      durationMinutes: 150,
      doorsOpenMinutesBefore: null,
      saleRules: { onSale: true, salesStart: null, salesEnd: null, maxPerOrder: 6 },
    },
  });
  assert.deepEqual(
    toUpdateTicketProductionInput(
      {
        title: '',
        subtitle: '',
        description: '',
        tags: '',
        location: '',
        durationMinutes: 'x',
        doorsOpenMinutesBefore: '',
        saleRules: { onSale: 'inherit', salesStart: '', salesEnd: '', maxPerOrder: '' },
      },
      shop,
    ),
    { errors: ['title', 'durationMinutes'] },
  );
});

test('a performance form shows its own values; blank details are taken from the production', () => {
  const row = {
    startsAt: '2026-11-01T18:00:00.000Z',
    cells: {
      adult: {
        _id: 'a',
        contractConfiguration: { supply: 100 },
        catalogPrice: { amount: 4500, currencyCode: 'CHF' },
        event: {
          location: 'Studio',
          durationMinutes: 150,
          overridden: ['location'],
          ownSaleRules: { maxPerOrder: 2 },
        },
      },
      reduced: {
        _id: 'b',
        contractConfiguration: { supply: 20 },
        catalogPrice: { amount: 2500, currencyCode: 'CHF' },
        event: { location: 'Studio', overridden: ['location'], ownSaleRules: {} },
      },
    },
    products: [],
  };
  const values = performanceFormValues(row, ['adult', 'reduced']);
  assert.equal(values.location, 'Studio');
  assert.equal(values.durationMinutes, '', 'inherited');
  assert.equal(values.saleRules.maxPerOrder, '2');
  assert.deepEqual(values.tickets, {
    adult: { supply: '100', price: '45.00' },
    reduced: { supply: '20', price: '25.00' },
  });

  // Only what changed is sent; a blank detail goes back to the production value
  const changed = {
    ...values,
    location: '',
    tickets: { ...values.tickets, reduced: { supply: '10', price: '25.00' } },
  };
  assert.deepEqual(toTicketPerformanceInput(changed, values, shop), {
    input: {
      location: null,
      saleRules: { onSale: null, salesStart: null, salesEnd: null, maxPerOrder: 2 },
      tickets: [{ category: 'reduced', supply: 10 }],
    },
  });
  // A new start reschedules
  const moved = { ...values, startsAt: '2026-11-03T20:00' };
  const movedResult = toTicketPerformanceInput(moved, values, shop);
  assert.ok('input' in movedResult);
  assert.equal(movedResult.input.startsAt, new Date('2026-11-03T20:00').toISOString());
});

test('a new performance sends its start and the values that differ from the categories', () => {
  const values = { ...performanceFormValues(null, ['adult']), startsAt: '2026-12-01T19:00' };
  assert.deepEqual(values.tickets, { adult: { supply: '', price: '' } });
  assert.deepEqual(toTicketPerformanceInput(values, null, shop), {
    input: {
      startsAt: new Date('2026-12-01T19:00').toISOString(),
      saleRules: { onSale: null, salesStart: null, salesEnd: null, maxPerOrder: null },
    },
  });
  assert.deepEqual(toTicketPerformanceInput({ ...values, startsAt: '' }, null, shop), {
    errors: ['startsAt'],
  });
});
