import { afterEach, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveEventCancelledTemplate } from './resolveEventCancelledTemplate.ts';
import { resolveTicketCancelledTemplate } from './resolveTicketCancelledTemplate.ts';

const ENV_KEYS = ['EMAIL_FROM', 'EMAIL_WEBSITE_NAME', 'EMAIL_WEBSITE_URL'];
// Hooks stay inside this suite: at the top level they would wrap every test of a shared-process run
describe('cancellation templates', () => {
  let savedEnv: Record<string, string | undefined>;
  beforeEach(() => {
    savedEnv = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));
  });
  afterEach(() => {
    for (const [key, value] of Object.entries(savedEnv)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  const slot = '2026-10-01T18:00:00.000Z';
  const eventText = `(${new Date(slot).toLocaleString('en', { dateStyle: 'medium', timeStyle: 'short' })} at Main stage)`;

  const context = (product: any) =>
    ({
      modules: {
        users: {
          findUserById: async () => ({
            _id: 'buyer',
            lastContact: { emailAddress: 'buyer@example.com' },
          }),
          primaryEmail: () => null,
          userLocale: () => new Intl.Locale('en'),
        },
        products: {
          findProduct: async () => product,
          texts: { findLocalizedText: async () => ({ title: 'Premiere' }) },
        },
        warehousing: { findToken: async () => ({ _id: 'ticket', productId: 'event' }) },
      },
    }) as any;

  const eventWithDetails = {
    _id: 'event',
    meta: { slot, location: 'Main stage' },
    tokenization: { supply: 10, ercMetadataProperties: { location: 'Not the venue' } },
  };

  test('cancellation e-mails describe the event from its event details', async () => {
    for (const [resolve, params] of [
      [resolveEventCancelledTemplate, { productId: 'event', userId: 'buyer' }],
      [resolveTicketCancelledTemplate, { tokenId: 'ticket', userId: 'buyer' }],
    ] as const) {
      const [message] = await (resolve as any)(params, context(eventWithDetails));
      assert.ok(message.input.text.includes(eventText), message.input.text);
      assert.equal(message.input.to, 'buyer@example.com');
    }
  });

  test('the sender is read from the environment when the e-mail is built', async () => {
    process.env.EMAIL_FROM = 'tickets@theater.example';
    process.env.EMAIL_WEBSITE_NAME = 'Theater';
    process.env.EMAIL_WEBSITE_URL = 'https://theater.example';
    for (const [resolve, params] of [
      [resolveEventCancelledTemplate, { productId: 'event', userId: 'buyer' }],
      [resolveTicketCancelledTemplate, { tokenId: 'ticket', userId: 'buyer' }],
    ] as const) {
      const [message] = await (resolve as any)(params, context(eventWithDetails));
      assert.equal(message.input.from, 'Theater <tickets@theater.example>');
      assert.ok(message.input.text.endsWith('Theater\nhttps://theater.example\n'));
    }
  });
});
