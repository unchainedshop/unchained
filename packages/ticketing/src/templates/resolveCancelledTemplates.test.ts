import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import type { CancellationNotice } from './resolveCancelledTemplates.ts';
import { resolveEventCancelledTemplate } from './resolveEventCancelledTemplate.ts';
import { resolveTicketCancelledTemplate } from './resolveTicketCancelledTemplate.ts';

const slot = '2026-10-01T18:00:00.000Z';
const date = new Date(slot).toLocaleString('en', { dateStyle: 'medium', timeStyle: 'short' });
const buyer = { userId: 'buyer' };
const api = {
  modules: {
    users: {
      findUserById: async () => ({ lastContact: { emailAddress: 'buyer@example.com' } }),
      userLocale: () => new Intl.Locale('en'),
    },
    products: {
      findProduct: async () => ({
        meta: { slot, location: 'Main stage' },
        tokenization: { supply: 10, ercMetadataProperties: { location: 'Not the venue' } },
      }),
      texts: { findLocalizedText: async () => ({ title: 'Premiere' }) },
    },
    warehousing: { findToken: async () => ({ productId: 'event' }) },
    orders: {
      findOrder: async ({ orderId }) => ({
        contact: { emailAddress: orderId === 'walk-in' ? 'walk-in@example.com' : null },
      }),
    },
  },
};

const templates = {
  Event: (notice: CancellationNotice, context = api) =>
    resolveEventCancelledTemplate(
      { template: 'EVENT_CANCELLED', productId: 'event', ...notice },
      context,
    ),
  Ticket: (notice: CancellationNotice, context = api) =>
    resolveTicketCancelledTemplate(
      { template: 'TICKET_CANCELLED', tokenId: 'ticket', ...notice },
      context,
    ),
};

for (const [kind, render] of Object.entries(templates)) {
  describe(`${kind} cancellation e-mail`, () => {
    test('uses the event details, buyer address and configured sender', async (t) => {
      t.mock.property(process, 'env', {
        ...process.env,
        EMAIL_FROM: 'tickets@theater.example',
        EMAIL_WEBSITE_NAME: 'Theater',
        EMAIL_WEBSITE_URL: 'https://theater.example',
      });
      const [{ input }] = await render(buyer);
      assert.ok(input.text.includes(`(${date} at Main stage)`), input.text);
      assert.equal(input.subject, `Premiere: ${kind} Cancelled`);
      assert.equal(input.to, 'buyer@example.com');
      assert.equal(input.from, 'Theater <tickets@theater.example>');
      assert.ok(input.text.endsWith('Theater\nhttps://theater.example\n'));
    });

    test('resolves the issued currency only when the notice lacks its precision', async (t) => {
      const getCurrencyDecimals = t.mock.fn(async (code: string) => (code === 'CHF' ? 3 : undefined));
      const context = { ...api, getCurrencyDecimals };
      const body = async (currency: CancellationNotice) => {
        const [message] = await render(
          { ...buyer, discountCode: 'gift', discountAmount: 1240, ...currency },
          context,
        );
        return message.input.text;
      };
      assert.match(
        await body({ discountCurrencyCode: 'JPY', discountCurrencyDecimals: 0 }),
        /worth JPY\u00a01,240:/,
      );
      assert.match(await body({ discountCurrencyCode: 'CHF' }), /worth CHF\u00a01\.240:/);
      assert.match(await body({ discountCurrencyCode: 'EUR' }), /worth EUR\u00a012\.40:/);
      assert.match(await body({}), /worth 12\.40:/);
      assert.deepEqual(
        getCurrencyDecimals.mock.calls.map((call) => call.arguments),
        [['CHF'], ['EUR']],
      );
    });

    test('mails the order contact, including for a ticket without an owner', async () => {
      const [walkIn] = await render({ ...buyer, orderId: 'walk-in' });
      assert.equal(walkIn.input.to, 'walk-in@example.com');
      assert.deepEqual(await render({ ...buyer, orderId: 'anonymous' }), []);
      const [exported] = await render({ orderId: 'walk-in' });
      assert.equal(exported.input.to, 'walk-in@example.com');
    });
  });
}
