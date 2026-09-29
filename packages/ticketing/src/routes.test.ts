import { after, afterEach, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { once } from 'node:events';
import { Readable } from 'node:stream';
import express from 'express';
import Fastify from 'fastify';
import type { PluginHttpRoute } from '@unchainedshop/core';
import { mountRoutes as mountExpressRoutes } from '@unchainedshop/api/lib/express/mountRoutes.js';
import { mountRoutes as mountFastifyRoutes } from '@unchainedshop/api/lib/fastify/mountRoutes.js';
import { createTicketingRoutes } from './routes.ts';
import { RendererTypes, registerRenderer, renderers } from './template-registry.ts';

const PASS_TYPE = 'pass.shop.unchained.ticket';
const buyersTicket = {
  _id: 'ticket-1',
  tokenSerialNumber: '7',
  userId: 'buyer',
  productId: 'event',
  orderPositionId: 'position',
  quantity: 1,
  meta: { orderId: 'order-1' },
};
const accessKeyOf = (token: { _id: string }) => `access-key-${token._id}`;

// Hooks stay inside this suite: at the top level they would wrap every test of a shared-process run
describe('ticketing routes', () => {
  // The registry is process-wide; keep whatever other suites registered.
  let registeredRenderers: Map<string, any>;
  beforeEach(() => {
    registeredRenderers = new Map(renderers);
    renderers.clear();
  });
  afterEach(() => {
    renderers.clear();
    for (const [type, renderer] of registeredRenderers) renderers.set(type, renderer);
  });

  function createPassStore() {
    const passFile = {
      _id: 'pass-file',
      updated: new Date('2026-09-01T10:00:00.500Z'),
      meta: {
        rawData: buyersTicket,
        passTypeIdentifier: PASS_TYPE,
        serialNumber: 'serial-1',
        registrations: [] as { deviceLibraryIdentifier: string; pushToken: string }[],
      },
    };
    const calls: Record<string, any[]> = {};
    const track = (name: string, args: any[]) => {
      calls[name] = [...(calls[name] || []), args];
    };
    const passes = {
      buildMagicKey: async (orderId: string) => `magic-${orderId}`,
      upsertAppleWalletPass: async (...args: any[]) => {
        track('upsertAppleWalletPass', args);
        return passFile;
      },
      upsertGoogleWalletPass: async (token: any, context: any) =>
        renderers.get(RendererTypes.GOOGLE_WALLET)!(token, context),
      findAppleWalletPass: async (passTypeIdentifier: string, serialNumber: string) => {
        track('findAppleWalletPass', [passTypeIdentifier, serialNumber]);
        return passTypeIdentifier === PASS_TYPE && serialNumber === 'serial-1' ? passFile : null;
      },
      registerDeviceForAppleWalletPass: async (
        passTypeIdentifier: string,
        serialNumber: string,
        registration: { deviceLibraryIdentifier: string; pushToken: string },
      ) => {
        track('registerDeviceForAppleWalletPass', [passTypeIdentifier, serialNumber, registration]);
        const exists = passFile.meta.registrations.some(
          (r) => r.deviceLibraryIdentifier === registration.deviceLibraryIdentifier,
        );
        if (!exists) passFile.meta.registrations.push(registration);
        return !exists;
      },
      unregisterDeviceForAppleWalletPass: async (...args: any[]) => {
        track('unregisterDeviceForAppleWalletPass', args);
        return true;
      },
      findUpdatedAppleWalletPasses: async (...args: any[]) => {
        track('findUpdatedAppleWalletPasses', args);
        return args[1] === 'device-with-passes' ? [passFile] : [];
      },
    };
    return { passes, passFile, calls };
  }

  function createContext({
    canViewOrder = true,
    headers = {},
  }: { canViewOrder?: boolean; headers?: Record<string, string> } = {}) {
    const store = createPassStore();
    const permissionChecks: any[] = [];
    const context = {
      userId: undefined,
      getHeader: (name: string) => headers[name],
      roles: {
        userHasPermission: async (_context: unknown, action: string, args: unknown[]) => {
          permissionChecks.push([action, args]);
          return canViewOrder;
        },
      },
      modules: {
        orders: {
          findOrder: async ({ orderId }: { orderId: string }) =>
            orderId === 'order-1' ? { _id: 'order-1', userId: 'buyer', status: 'CONFIRMED' } : null,
        },
        warehousing: {
          findToken: async ({ tokenId }: { tokenId: string }) =>
            tokenId === buyersTicket._id ? buyersTicket : null,
          buildAccessKeyFromToken: async (token: { _id: string }) => accessKeyOf(token),
        },
        passes: store.passes,
      },
      services: {
        files: {
          createDownloadStream: async ({ fileId }: { fileId: string }) =>
            Readable.from([Buffer.from(`pkpass:${fileId}`)]),
        },
      },
    };
    return { context, permissionChecks, ...store };
  }

  // Resolves a request the way the HTTP connectors do: by method and path pattern.
  async function dispatch(
    routes: PluginHttpRoute[],
    url: string,
    context: object,
    init: RequestInit = {},
  ): Promise<Response> {
    const request = new Request(new URL(url, 'http://engine.test'), init);
    for (const route of routes) {
      const match = new URLPattern({ pathname: route.path }).exec(request.url);
      if (match && (route.method === 'ALL' || route.method === request.method)) {
        const params = match.pathname.groups as Record<string, string>;
        return route.handler(request, { ...context, params } as any);
      }
    }
    return new Response(null, { status: 404 });
  }

  const routes = createTicketingRoutes();
  const applePass = `/rest/apple-wallet/v1/passes/${PASS_TYPE}/serial-1`;
  const deviceRegistration = `/rest/apple-wallet/v1/devices/device-1/registrations/${PASS_TYPE}/serial-1`;
  const applePassAuth = { authorization: `ApplePass ${buyersTicket._id}` };

  test('routes declare explicit methods under the default base paths', () => {
    assert.deepEqual(
      routes.map(({ method, path }) => `${method} ${path}`),
      [
        'GET /rest/print_tickets',
        'GET /rest/google-wallet/download/:tokenId',
        'GET /rest/apple-wallet/download/:passFileName',
        'POST /rest/apple-wallet/v1/devices/:deviceLibraryIdentifier/registrations/:passTypeIdentifier/:serialNumber',
        'DELETE /rest/apple-wallet/v1/devices/:deviceLibraryIdentifier/registrations/:passTypeIdentifier/:serialNumber',
        'GET /rest/apple-wallet/v1/devices/:deviceLibraryIdentifier/registrations/:passTypeIdentifier',
        'GET /rest/apple-wallet/v1/passes/:passTypeIdentifier/:serialNumber',
        'POST /rest/apple-wallet/v1/log',
      ],
    );
  });

  describe('print tickets', () => {
    const renderPDF = async ({ orderId, variant }: { orderId: string; variant?: string }) =>
      Readable.from([Buffer.from(`%PDF ${orderId} ${variant}`)]);

    test('checks viewOrder with the orderId and otp and answers 403 when denied', async () => {
      registerRenderer(RendererTypes.ORDER_PDF, renderPDF as any);
      const { context, permissionChecks } = createContext({ canViewOrder: false });
      const response = await dispatch(routes, '/rest/print_tickets?orderId=order-1&otp=wrong', context);
      assert.equal(response.status, 403);
      assert.deepEqual(permissionChecks, [
        ['viewOrder', [undefined, { orderId: 'order-1', otp: 'wrong' }]],
      ]);
    });

    test('answers 403 without an orderId', async () => {
      registerRenderer(RendererTypes.ORDER_PDF, renderPDF as any);
      const { context } = createContext();
      assert.equal((await dispatch(routes, '/rest/print_tickets', context)).status, 403);
    });

    test('answers 404 when no PDF renderer is registered or the order does not exist', async () => {
      const { context } = createContext();
      const unconfigured = await dispatch(routes, '/rest/print_tickets?orderId=order-1&otp=x', context);
      assert.equal(unconfigured.status, 404);
      registerRenderer(RendererTypes.ORDER_PDF, renderPDF as any);
      const unknown = await dispatch(routes, '/rest/print_tickets?orderId=unknown&otp=x', context);
      assert.equal(unknown.status, 404);
    });

    test('streams the rendered PDF of the order and variant', async () => {
      registerRenderer(RendererTypes.ORDER_PDF, renderPDF as any);
      const { context } = createContext();
      const response = await dispatch(
        routes,
        '/rest/print_tickets?orderId=order-1&otp=magic-order-1&variant=a4',
        context,
      );
      assert.equal(response.status, 200);
      assert.equal(response.headers.get('content-type'), 'application/pdf');
      assert.match(response.headers.get('cache-control') || '', /no-store/);
      assert.equal(await response.text(), '%PDF order-1 a4');
    });
  });

  describe('google wallet download', () => {
    const url = (hash: string, tokenId = buyersTicket._id) =>
      `/rest/google-wallet/download/${tokenId}?hash=${hash}`;

    test('answers 404 for unknown tokens and 403 for a wrong hash', async () => {
      registerRenderer(RendererTypes.GOOGLE_WALLET, async () => 'https://pay.google.com/gp/v/save/jwt');
      const { context } = createContext();
      const unknown = await dispatch(routes, url('x', 'unknown'), context);
      assert.equal(unknown.status, 404);
      assert.deepEqual(await unknown.json(), { error: 'Token not found' });
      assert.equal((await dispatch(routes, url('wrong'), context)).status, 403);
      assert.equal(
        (await dispatch(routes, `/rest/google-wallet/download/${buyersTicket._id}`, context)).status,
        403,
      );
    });

    test('answers 404 without a renderer or when the renderer returns no pass', async () => {
      const { context } = createContext();
      assert.equal((await dispatch(routes, url(accessKeyOf(buyersTicket)), context)).status, 404);
      registerRenderer(RendererTypes.GOOGLE_WALLET, async () => null);
      assert.equal((await dispatch(routes, url(accessKeyOf(buyersTicket)), context)).status, 404);
    });

    test('redirects to the save link returned as a string or through asURL()', async () => {
      const { context } = createContext();
      for (const renderer of [
        async () => 'https://pay.google.com/gp/v/save/jwt',
        async () => ({ asURL: async () => 'https://pay.google.com/gp/v/save/jwt' }),
      ]) {
        registerRenderer(RendererTypes.GOOGLE_WALLET, renderer);
        const response = await dispatch(routes, url(accessKeyOf(buyersTicket)), context);
        assert.equal(response.status, 302);
        assert.equal(response.headers.get('location'), 'https://pay.google.com/gp/v/save/jwt');
      }
    });
  });

  describe('apple wallet', () => {
    const createAppleWalletPass = async () => ({
      asURL: async () => 'unused',
      asBuffer: async () => Buffer.from('pkpass'),
      serialNumber: 'serial-1',
      passTypeIdentifier: PASS_TYPE,
    });
    const download = (hash: string, file = `${buyersTicket._id}.pkpass`) =>
      `/rest/apple-wallet/download/${file}?hash=${hash}`;

    test('download answers 404 for unknown tokens or without a renderer, 403 for a wrong hash', async () => {
      const { context, calls } = createContext();
      assert.equal((await dispatch(routes, download(accessKeyOf(buyersTicket)), context)).status, 404);
      registerRenderer(RendererTypes.APPLE_WALLET, createAppleWalletPass);
      const unknown = await dispatch(routes, download('x', 'unknown.pkpass'), context);
      assert.equal(unknown.status, 404);
      assert.deepEqual(await unknown.json(), { error: 'Token not found' });
      assert.equal((await dispatch(routes, download('wrong'), context)).status, 403);
      assert.equal(calls.upsertAppleWalletPass, undefined);
    });

    test('download renders the pass of the token named by the .pkpass file', async () => {
      registerRenderer(RendererTypes.APPLE_WALLET, createAppleWalletPass);
      const { context, calls } = createContext();
      const response = await dispatch(routes, download(accessKeyOf(buyersTicket)), context);
      assert.equal(response.status, 200);
      assert.equal(response.headers.get('content-type'), 'application/vnd.apple.pkpass');
      assert.match(response.headers.get('content-disposition') || '', /ticket-1\.pkpass/);
      assert.equal(await response.text(), 'pkpass:pass-file');
      assert.equal(calls.upsertAppleWalletPass[0][0], buyersTicket);
    });

    test('registers a device for a pass: 201 when new, 200 when known, 401 with a wrong token', async () => {
      const { context, calls } = createContext();
      const register = (headers: Record<string, string>, path = deviceRegistration) =>
        dispatch(routes, path, context, {
          method: 'POST',
          headers: { 'content-type': 'application/json', ...headers },
          body: JSON.stringify({ pushToken: 'push-1' }),
        });
      assert.equal((await register({ authorization: 'ApplePass other' })).status, 401);
      assert.equal((await register({})).status, 401);
      const unknownPass = deviceRegistration.replace('serial-1', 'serial-2');
      assert.equal((await register(applePassAuth, unknownPass)).status, 404);
      assert.equal((await register(applePassAuth)).status, 201);
      assert.equal((await register(applePassAuth)).status, 200);
      assert.deepEqual(calls.registerDeviceForAppleWalletPass[0], [
        PASS_TYPE,
        'serial-1',
        { deviceLibraryIdentifier: 'device-1', pushToken: 'push-1' },
      ]);
    });

    test('unregisters a device from a pass', async () => {
      const { context, calls } = createContext();
      const unauthorized = await dispatch(routes, deviceRegistration, context, { method: 'DELETE' });
      assert.equal(unauthorized.status, 401);
      const response = await dispatch(routes, deviceRegistration, context, {
        method: 'DELETE',
        headers: applePassAuth,
      });
      assert.equal(response.status, 200);
      assert.deepEqual(calls.unregisterDeviceForAppleWalletPass, [[PASS_TYPE, 'serial-1', 'device-1']]);
    });

    test('lists the serial numbers of updated passes of a device, 204 when there are none', async () => {
      const { context, calls } = createContext();
      const since = '2026-09-01T00:00:00.000Z';
      const response = await dispatch(
        routes,
        `/rest/apple-wallet/v1/devices/device-with-passes/registrations/${PASS_TYPE}?passesUpdatedSince=${since}`,
        context,
      );
      assert.equal(response.status, 200);
      const body = await response.json();
      assert.deepEqual(body.serialNumbers, ['serial-1']);
      assert.ok(body.lastUpdated);
      assert.deepEqual(calls.findUpdatedAppleWalletPasses[0], [
        PASS_TYPE,
        'device-with-passes',
        new Date(since),
      ]);
      const none = await dispatch(
        routes,
        `/rest/apple-wallet/v1/devices/device-1/registrations/${PASS_TYPE}`,
        context,
      );
      assert.equal(none.status, 204);
      assert.equal(calls.findUpdatedAppleWalletPasses[1][2], undefined);
    });

    test('serves the latest pass with Last-Modified and answers 304 when unchanged', async () => {
      const { context } = createContext();
      assert.equal((await dispatch(routes, applePass, context)).status, 401);
      const unknown = applePass.replace('serial-1', 'serial-2');
      assert.equal((await dispatch(routes, unknown, context, { headers: applePassAuth })).status, 404);
      const response = await dispatch(routes, applePass, context, { headers: applePassAuth });
      assert.equal(response.status, 200);
      assert.equal(response.headers.get('content-type'), 'application/vnd.apple.pkpass');
      assert.equal(response.headers.get('last-modified'), 'Tue, 01 Sep 2026 10:00:00 GMT');
      assert.equal(await response.text(), 'pkpass:pass-file');
      const unchanged = await dispatch(routes, applePass, context, {
        headers: { ...applePassAuth, 'if-modified-since': 'Tue, 01 Sep 2026 10:00:00 GMT' },
      });
      assert.equal(unchanged.status, 304);
    });

    test('accepts device logs', async () => {
      const { context } = createContext();
      const response = await dispatch(routes, '/rest/apple-wallet/v1/log', context, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ logs: ['Web service error'] }),
      });
      assert.equal(response.status, 200);
    });
  });

  test('route base paths come from the environment when the routes are created', () => {
    const previous = process.env.APPLE_WALLET_WEBSERVICE_PATH;
    process.env.APPLE_WALLET_WEBSERVICE_PATH = '/wallet/apple/';
    try {
      const paths = createTicketingRoutes().map(({ path }) => path);
      assert.ok(paths.includes('/wallet/apple/v1/log'));
      assert.ok(paths.includes('/rest/print_tickets'));
    } finally {
      if (previous === undefined) delete process.env.APPLE_WALLET_WEBSERVICE_PATH;
      else process.env.APPLE_WALLET_WEBSERVICE_PATH = previous;
    }
  });

  describe('mounted through the api connectors', () => {
    const servers: http.Server[] = [];
    const fastifyApps: ReturnType<typeof Fastify>[] = [];
    after(async () => {
      await Promise.all(fastifyApps.map((app) => app.close()));
      for (const server of servers) server.close();
    });

    const start = {
      express: async (unchainedAPI: any) => {
        const app = express();
        mountExpressRoutes(app, unchainedAPI, routes);
        const server = http.createServer(app);
        servers.push(server);
        server.listen(0, '127.0.0.1');
        await once(server, 'listening');
        return `http://127.0.0.1:${(server.address() as { port: number }).port}`;
      },
      fastify: async (unchainedAPI: any) => {
        const app = Fastify();
        fastifyApps.push(app);
        mountFastifyRoutes(app, unchainedAPI, routes);
        await app.listen({ port: 0, host: '127.0.0.1' });
        return `http://127.0.0.1:${(app.server.address() as { port: number }).port}`;
      },
    };

    for (const framework of ['express', 'fastify'] as const) {
      test(`${framework} passes path params, JSON bodies and redirects through`, async () => {
        registerRenderer(
          RendererTypes.GOOGLE_WALLET,
          async () => 'https://pay.google.com/gp/v/save/jwt',
        );
        const { context, calls } = createContext();
        const baseUrl = await start[framework](context);

        const registered = await fetch(`${baseUrl}${deviceRegistration}`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', ...applePassAuth },
          body: JSON.stringify({ pushToken: 'push-1' }),
        });
        assert.equal(registered.status, 201);
        assert.deepEqual(calls.registerDeviceForAppleWalletPass[0][2], {
          deviceLibraryIdentifier: 'device-1',
          pushToken: 'push-1',
        });

        const log = await fetch(`${baseUrl}/rest/apple-wallet/v1/log`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ logs: ['hello'] }),
        });
        assert.equal(log.status, 200);

        const pass = await fetch(`${baseUrl}${applePass}`, { headers: applePassAuth });
        assert.equal(pass.status, 200);
        assert.equal(await pass.text(), 'pkpass:pass-file');

        const google = await fetch(
          `${baseUrl}/rest/google-wallet/download/${buyersTicket._id}?hash=${accessKeyOf(buyersTicket)}`,
          { redirect: 'manual' },
        );
        assert.equal(google.status, 302);
        assert.equal(google.headers.get('location'), 'https://pay.google.com/gp/v/save/jwt');
      });
    }
  });
});
