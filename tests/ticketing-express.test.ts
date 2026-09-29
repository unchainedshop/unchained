import assert from 'node:assert/strict';
import { once } from 'node:events';
import { existsSync } from 'node:fs';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { Readable } from 'node:stream';
import { test } from 'node:test';
import express from 'express';
import { connect } from '@unchainedshop/api/express';
import { RendererTypes } from '@unchainedshop/ticketing';
import { ticketingAdminPlugin, ticketingBundlePath } from '@unchainedshop/ticketing/admin-plugin';
import { registerRenderer } from '@unchainedshop/ticketing/lib/template-registry.js';
import { setupDatabase, createLoggedInGraphqlFetch } from './helpers.js';
import { getTestPlatform } from './setup.js';
import { USER_TOKEN } from './seeds/users.js';
import seedTicketing, { TheaterEventId, buyTickets } from './seeds/ticketing.js';

// The shared test platform serves Fastify. This mounts the same platform (and so the same plugin
// routes) on Express 5 through @unchainedshop/api/express, with the Admin UI and the ticketing
// admin plugin, the way a project serving Express would.
test.describe('Ticketing: Express 5 smoke test', () => {
  let server: Server;
  let baseUrl: string;
  let orderId: string;
  let magicKey: string;
  let ticket;

  test.before(async () => {
    const [db] = await setupDatabase();
    await seedTicketing(db);
    const userFetch = createLoggedInGraphqlFetch(USER_TOKEN);
    const { order, tickets } = await buyTickets(userFetch, {
      orderNumber: 'express-order',
      positions: [{ productId: TheaterEventId, quantity: 1 }],
    });
    orderId = order._id;
    [ticket] = tickets;
    const { data } = await userFetch({
      query: /* GraphQL */ `
        query MagicKey($orderId: ID!) {
          order(orderId: $orderId) {
            magicKey
          }
        }
      `,
      variables: { orderId },
    });
    magicKey = data.order.magicKey;

    const app = express();
    await connect(app, getTestPlatform(), { adminUI: { plugins: [ticketingAdminPlugin()] } });
    server = app.listen(0, '127.0.0.1');
    await once(server, 'listening');
    baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  test.after(async () => {
    server?.closeAllConnections();
    await new Promise((resolve) => server?.close(resolve));
  });

  test('GraphQL answers on Express', async () => {
    const response = await fetch(`${baseUrl}/graphql`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: USER_TOKEN },
      body: JSON.stringify({ query: '{ me { _id } }' }),
    });
    assert.equal(response.status, 200);
    assert.deepEqual((await response.json()).data, { me: { _id: 'user' } });
  });

  test('the ticketing routes answer before the Admin UI catch-all', async () => {
    const print = await fetch(`${baseUrl}/rest/print_tickets`);
    assert.equal(print.status, 403);

    const printWithoutRenderer = await fetch(
      `${baseUrl}/rest/print_tickets?orderId=${orderId}&otp=${magicKey}`,
    );
    assert.equal(printWithoutRenderer.status, 404);
    assert.deepEqual(await printWithoutRenderer.json(), { error: 'Ticket PDF not configured' });

    const google = await fetch(`${baseUrl}/rest/google-wallet/download/unknown-token?hash=x`);
    assert.equal(google.status, 404);
    assert.deepEqual(await google.json(), { error: 'Token not found' });

    const apple = await fetch(`${baseUrl}/rest/apple-wallet/download/unknown-token.pkpass?hash=x`);
    assert.equal(apple.status, 404);
    assert.deepEqual(await apple.json(), { error: 'Token not found' });

    const updatable = await fetch(
      `${baseUrl}/rest/apple-wallet/v1/devices/device-1/registrations/pass.shop.unchained.test`,
    );
    assert.equal(updatable.status, 204);

    const latestPass = await fetch(
      `${baseUrl}/rest/apple-wallet/v1/passes/pass.shop.unchained.test/unknown-serial`,
    );
    assert.equal(latestPass.status, 404);
    assert.notEqual(latestPass.headers.get('content-type'), 'text/html; charset=utf-8');

    const register = await fetch(
      `${baseUrl}/rest/apple-wallet/v1/devices/device-1/registrations/pass.shop.unchained.test/unknown-serial`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: 'ApplePass x' },
        body: JSON.stringify({ pushToken: 'push-token' }),
      },
    );
    assert.equal(register.status, 404);

    const log = await fetch(`${baseUrl}/rest/apple-wallet/v1/log`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ logs: ['device log line'] }),
    });
    assert.equal(log.status, 200);
  });

  test('responses of the renderers are written by the Express connector', async () => {
    registerRenderer(RendererTypes.ORDER_PDF, async ({ orderId: id }) => Readable.from([`%PDF ${id}`]));
    registerRenderer(
      RendererTypes.GOOGLE_WALLET,
      async (token) => `https://pay.google.com/save/${token._id}`,
    );
    try {
      const withOtp = await fetch(`${baseUrl}/rest/print_tickets?orderId=${orderId}&otp=${magicKey}`);
      assert.equal(withOtp.status, 200);
      assert.equal(withOtp.headers.get('content-type'), 'application/pdf');
      assert.equal(await withOtp.text(), `%PDF ${orderId}`);

      // The session of the order owner reaches the route handler as request context
      const owner = await fetch(`${baseUrl}/rest/print_tickets?orderId=${orderId}`, {
        headers: { authorization: USER_TOKEN },
      });
      assert.equal(owner.status, 200);

      const google = await fetch(
        `${baseUrl}/rest/google-wallet/download/${ticket._id}?hash=${ticket.accessKey}`,
        { redirect: 'manual' },
      );
      assert.equal(google.status, 302);
      assert.equal(google.headers.get('location'), `https://pay.google.com/save/${ticket._id}`);
    } finally {
      registerRenderer(RendererTypes.ORDER_PDF, null);
      registerRenderer(RendererTypes.GOOGLE_WALLET, null);
    }
  });

  test('the Admin UI and the ticketing admin plugin are still served', async () => {
    const page = await fetch(`${baseUrl}/ext/gate-control`);
    assert.equal(page.status, 200);
    assert.match(page.headers.get('content-type'), /text\/html/);

    // Without the bundle the plugin route is skipped and the Admin UI catch-all answers with HTML
    assert.ok(
      existsSync(ticketingBundlePath),
      `${ticketingBundlePath} is missing: run "npm run build" (or "npm run build:ticketing-admin-plugin") first`,
    );
    const bundle = await fetch(`${baseUrl}/admin-plugins/ticketing.js`);
    assert.equal(bundle.status, 200);
    assert.match(bundle.headers.get('content-type'), /javascript/);
  });
});
