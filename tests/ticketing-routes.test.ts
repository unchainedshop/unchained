import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { test } from 'node:test';
import { MessagingDirector } from '@unchainedshop/core';
import {
  RendererTypes,
  TicketingMessageTypes,
  registerTicketingTemplates,
} from '@unchainedshop/ticketing';
import { registerRenderer } from '@unchainedshop/ticketing/lib/template-registry.js';
import { setupDatabase, createLoggedInGraphqlFetch, getServerBaseUrl } from './helpers.js';
import { ADMIN_TOKEN, USER_TOKEN } from './seeds/users.js';
import seedTicketing, { GATE_TOKEN, TheaterEventId, buyTickets } from './seeds/ticketing.js';

const PASS_TYPE = 'pass.shop.unchained.test';

// The shared test platform registers ticketing without renderers; these tests register stubs in
// the renderer registry the platform reads from and remove them again.
const withRenderers = async (renderers: Record<string, any>, run: () => Promise<void>) => {
  for (const [type, renderer] of Object.entries(renderers)) registerRenderer(type as any, renderer);
  try {
    await run();
  } finally {
    for (const type of Object.keys(renderers)) registerRenderer(type as any, null);
  }
};

test.describe('Ticketing: routes', () => {
  let db;
  let userFetch;
  let orderId: string;
  let magicKey: string;
  let ticket;
  let baseUrl: string;

  test.before(async () => {
    [db] = await setupDatabase();
    await seedTicketing(db);
    baseUrl = getServerBaseUrl();
    userFetch = createLoggedInGraphqlFetch(USER_TOKEN);
    const { order, tickets } = await buyTickets(userFetch, {
      orderNumber: 'routes-order',
      positions: [{ productId: TheaterEventId, quantity: 2 }],
      attendees: ['Ada Lovelace', 'Alan Turing'],
    });
    orderId = order._id;
    [ticket] = tickets;
    const { data, errors } = await userFetch({
      query: /* GraphQL */ `
        query MagicKey($orderId: ID!) {
          order(orderId: $orderId) {
            magicKey
          }
        }
      `,
      variables: { orderId },
    });
    assert.ifError(errors?.[0]);
    magicKey = data.order.magicKey;
  });

  test.describe('print tickets', () => {
    const printUrl = (params: Record<string, string>) =>
      `${baseUrl}/rest/print_tickets?${new URLSearchParams(params)}`;

    test('refuses requests without a valid otp or session', async () => {
      assert.equal((await fetch(`${baseUrl}/rest/print_tickets`)).status, 403);
      assert.equal((await fetch(printUrl({ orderId }))).status, 403);
      assert.equal((await fetch(printUrl({ orderId, otp: 'f'.repeat(64) }))).status, 403);
      // Other users' sessions do not open the order
      const gate = await fetch(printUrl({ orderId }), { headers: { authorization: GATE_TOKEN } });
      assert.equal(gate.status, 403);
    });

    test('answers 404 without a PDF renderer', async () => {
      const response = await fetch(printUrl({ orderId, otp: magicKey }));
      assert.equal(response.status, 404);
      assert.deepEqual(await response.json(), { error: 'Ticket PDF not configured' });
    });

    test('renders the PDF for the otp, the owner and the ticketsPdfUrl link', async () => {
      const calls: { orderId: string; variant?: string }[] = [];
      const renderOrderPDF = async (params) => {
        calls.push(params);
        return Readable.from([`%PDF-1.4 ${params.orderId}`]);
      };
      await withRenderers({ [RendererTypes.ORDER_PDF]: renderOrderPDF }, async () => {
        const withOtp = await fetch(printUrl({ orderId, otp: magicKey, variant: 'receipt' }));
        assert.equal(withOtp.status, 200);
        assert.equal(withOtp.headers.get('content-type'), 'application/pdf');
        assert.match(withOtp.headers.get('cache-control'), /no-store/);
        assert.equal(await withOtp.text(), `%PDF-1.4 ${orderId}`);
        assert.deepEqual(calls[0], { orderId, variant: 'receipt' });

        const owner = await fetch(printUrl({ orderId }), { headers: { authorization: USER_TOKEN } });
        assert.equal(owner.status, 200);

        const { data } = await userFetch({
          query: /* GraphQL */ `
            query PdfLink($orderId: ID!) {
              order(orderId: $orderId) {
                ticketsPdfUrl
              }
            }
          `,
          variables: { orderId },
        });
        const link = await fetch(data.order.ticketsPdfUrl);
        assert.equal(link.status, 200);
        assert.equal(await link.text(), `%PDF-1.4 ${orderId}`);
      });
    });
  });

  test.describe('Google Wallet', () => {
    const googleUrl = (tokenId: string, hash: string) =>
      `${baseUrl}/rest/google-wallet/download/${tokenId}?hash=${hash}`;

    test('checks the token and its access key, 404 without a renderer', async () => {
      const unknown = await fetch(googleUrl('unknown-token', 'x'));
      assert.equal(unknown.status, 404);
      assert.deepEqual(await unknown.json(), { error: 'Token not found' });

      assert.equal((await fetch(googleUrl(ticket._id, 'wrong'))).status, 403);

      const withoutRenderer = await fetch(googleUrl(ticket._id, ticket.accessKey));
      assert.equal(withoutRenderer.status, 404);
      assert.deepEqual(await withoutRenderer.json(), { error: 'Google Wallet not configured' });
    });

    test('redirects to the save link of the renderer', async () => {
      const saveLink = `https://pay.google.com/gp/v/save/${ticket._id}`;
      await withRenderers({ [RendererTypes.GOOGLE_WALLET]: async () => saveLink }, async () => {
        const response = await fetch(googleUrl(ticket._id, ticket.accessKey), { redirect: 'manual' });
        assert.equal(response.status, 302);
        assert.equal(response.headers.get('location'), saveLink);
      });
      await withRenderers(
        { [RendererTypes.GOOGLE_WALLET]: async () => ({ asURL: async () => saveLink }) },
        async () => {
          const response = await fetch(googleUrl(ticket._id, ticket.accessKey), { redirect: 'manual' });
          assert.equal(response.status, 302);
          assert.equal(response.headers.get('location'), saveLink);
        },
      );
      await withRenderers({ [RendererTypes.GOOGLE_WALLET]: async () => null }, async () => {
        const response = await fetch(googleUrl(ticket._id, ticket.accessKey), { redirect: 'manual' });
        assert.equal(response.status, 404);
      });
    });
  });

  test('Apple Wallet: download and the PassKit web service under the default path', async () => {
    const createAppleWalletPass = async (token) => ({
      serialNumber: token._id,
      passTypeIdentifier: PASS_TYPE,
      asBuffer: async () => Buffer.from(`pkpass ${token._id}`),
      asURL: async () => `${baseUrl}/rest/apple-wallet/download/${token._id}.pkpass`,
    });
    await withRenderers({ [RendererTypes.APPLE_WALLET]: createAppleWalletPass }, async () => {
      const wrongHash = await fetch(`${baseUrl}/rest/apple-wallet/download/${ticket._id}.pkpass?hash=x`);
      assert.equal(wrongHash.status, 403);

      const download = await fetch(
        `${baseUrl}/rest/apple-wallet/download/${ticket._id}.pkpass?hash=${ticket.accessKey}`,
      );
      assert.equal(download.status, 200);
      assert.equal(download.headers.get('content-type'), 'application/vnd.apple.pkpass');
      assert.equal(await download.text(), `pkpass ${ticket._id}`);

      const webService = `${baseUrl}/rest/apple-wallet/v1`;
      const registration = `${webService}/devices/device-1/registrations/${PASS_TYPE}/${ticket._id}`;
      const authorization = `ApplePass ${ticket._id}`;
      const register = (headers: Record<string, string>) =>
        fetch(registration, {
          method: 'POST',
          headers: { 'content-type': 'application/json', ...headers },
          body: JSON.stringify({ pushToken: 'push-token-1' }),
        });

      assert.equal((await register({ authorization: 'ApplePass wrong' })).status, 401);
      assert.equal((await register({ authorization })).status, 201);
      assert.equal((await register({ authorization })).status, 200);

      const updatable = await fetch(`${webService}/devices/device-1/registrations/${PASS_TYPE}`);
      assert.equal(updatable.status, 200);
      assert.deepEqual((await updatable.json()).serialNumbers, [ticket._id]);

      const latest = await fetch(`${webService}/passes/${PASS_TYPE}/${ticket._id}`, {
        headers: { authorization },
      });
      assert.equal(latest.status, 200);
      assert.equal(await latest.text(), `pkpass ${ticket._id}`);
      const notModified = await fetch(`${webService}/passes/${PASS_TYPE}/${ticket._id}`, {
        headers: { authorization, 'if-modified-since': new Date(Date.now() + 60000).toUTCString() },
      });
      assert.equal(notModified.status, 304);

      const unregister = await fetch(registration, { method: 'DELETE', headers: { authorization } });
      assert.equal(unregister.status, 200);
      const noneLeft = await fetch(`${webService}/devices/device-1/registrations/${PASS_TYPE}`);
      assert.equal(noneLeft.status, 204);

      const log = await fetch(`${webService}/log`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ logs: ['device log line'] }),
      });
      assert.equal(log.status, 200);
    });
  });

  test('a project cancellation template wins over the ticketing default', async () => {
    const defaultTemplate = MessagingDirector.getTemplate(TicketingMessageTypes.TICKET_CANCELLED);
    assert.ok(defaultTemplate, 'the ticketing plugin registers its default template');
    const rendered: Record<string, any>[] = [];
    const projectTemplate = async (input) => {
      rendered.push(input);
      return [];
    };
    MessagingDirector.registerTemplate(TicketingMessageTypes.TICKET_CANCELLED, projectTemplate);
    try {
      // Registering the ticketing defaults again (another plugin instance, a later boot step)
      // keeps the project template
      registerTicketingTemplates();
      assert.equal(
        MessagingDirector.getTemplate(TicketingMessageTypes.TICKET_CANCELLED),
        projectTemplate,
      );

      const { errors } = await createLoggedInGraphqlFetch(ADMIN_TOKEN)({
        query: /* GraphQL */ `
          mutation CancelTicket($tokenId: ID!) {
            cancelTicket(tokenId: $tokenId) {
              _id
            }
          }
        `,
        variables: { tokenId: ticket._id },
      });
      assert.ifError(errors?.[0]);

      // The MESSAGE work is processed by the worker of the test platform
      for (let attempt = 0; attempt < 50 && !rendered.length; attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      assert.equal(rendered.length, 1);
      assert.equal(rendered[0].tokenId, ticket._id);
      assert.equal(rendered[0].userId, 'user');
    } finally {
      MessagingDirector.registerTemplate(TicketingMessageTypes.TICKET_CANCELLED, defaultTemplate);
    }
  });
});
