import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  centsToDecimal,
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
    { errors: ['salesStart', 'maxPerOrder'] },
  );
});

test('a new production is created from its title, subtitle, tags and location', () => {
  // The admin-ui form turns blank fields into null
  assert.deepEqual(
    toCreateTicketProductionInput(
      { title: ' Hamlet ', subtitle: null, tags: ['organizer-a'], location: 'Grosse Bühne' },
      shop,
    ),
    {
      input: {
        texts: [{ locale: 'de', title: 'Hamlet' }],
        tags: ['organizer-a'],
        location: 'Grosse Bühne',
      },
    },
  );
  assert.deepEqual(toCreateTicketProductionInput({ title: null, tags: null }, shop), {
    errors: ['title'],
  });
});

test('the event form sends every detail and sale rule, blanks clear them', () => {
  assert.deepEqual(
    toUpdateTicketProductionInput({
      location: null,
      durationMinutes: '150',
      doorsOpenMinutesBefore: null,
      onSale: 'open',
      salesStart: null,
      salesEnd: '',
      maxPerOrder: '6',
    }),
    {
      input: {
        location: null,
        durationMinutes: 150,
        doorsOpenMinutesBefore: null,
        saleRules: { onSale: true, salesStart: null, salesEnd: null, maxPerOrder: 6 },
      },
    },
  );
  assert.deepEqual(
    toUpdateTicketProductionInput({ durationMinutes: 'long', onSale: 'inherit', maxPerOrder: '1.5' }),
    { errors: ['durationMinutes', 'maxPerOrder'] },
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
