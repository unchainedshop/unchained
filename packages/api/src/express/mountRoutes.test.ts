import { after, describe, it } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import { once } from 'node:events';
import express from 'express';
import Fastify from 'fastify';
import type { PluginHttpRoute, UnchainedCore } from '@unchainedshop/core';
import { mountRoutes as mountExpressRoutes } from './mountRoutes.ts';
import { mountRoutes as mountFastifyRoutes } from '../fastify/mountRoutes.ts';

const servers: http.Server[] = [];
const fastifyApps: ReturnType<typeof Fastify>[] = [];

after(async () => {
  await Promise.all(fastifyApps.map((app) => app.close()));
  for (const server of servers) {
    // A handler that never answers keeps its connection open; drop it so the suite can exit.
    server.closeAllConnections();
    server.close();
  }
});

const routes: PluginHttpRoute[] = [
  {
    path: '/hooks/echo',
    method: 'POST',
    handler: async (request) => Response.json({ received: await request.json() }),
  },
  {
    path: '/files/:directory/:name',
    method: 'ALL',
    handler: async (request, context) => {
      const headers = new Headers({ 'x-plugin': 'files' });
      headers.append('set-cookie', 'first=1');
      headers.append('set-cookie', 'second=2');
      return new Response(`${request.method} ${context.params.directory}/${context.params.name}`, {
        status: 201,
        headers,
      });
    },
  },
];

const unchainedAPI = {} as UnchainedCore;

const startExpress = async () => {
  const app = express();
  mountExpressRoutes(app, unchainedAPI, routes);
  const server = http.createServer(app);
  servers.push(server);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  return `http://127.0.0.1:${(server.address() as { port: number }).port}`;
};

const startFastify = async () => {
  const app = Fastify();
  fastifyApps.push(app);
  mountFastifyRoutes(app, unchainedAPI, routes);
  await app.listen({ port: 0, host: '127.0.0.1' });
  return `http://127.0.0.1:${(app.server.address() as { port: number }).port}`;
};

for (const [framework, start] of [
  ['express', startExpress],
  ['fastify', startFastify],
] as const) {
  describe(`mountRoutes (${framework})`, () => {
    it('sends the handler response for a POST route', async () => {
      const base = await start();
      const response = await fetch(`${base}/hooks/echo`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ event: 'payment.succeeded' }),
        signal: AbortSignal.timeout(2000),
      });
      assert.strictEqual(response.status, 200);
      assert.deepStrictEqual(await response.json(), { received: { event: 'payment.succeeded' } });
    });

    it('sends status, headers, cookies and body for an ALL route with params', async () => {
      const base = await start();
      const response = await fetch(`${base}/files/media/logo.png`, {
        method: 'PUT',
        body: 'binary',
        signal: AbortSignal.timeout(2000),
      });
      assert.strictEqual(response.status, 201);
      assert.strictEqual(response.headers.get('x-plugin'), 'files');
      assert.deepStrictEqual(response.headers.getSetCookie(), ['first=1', 'second=2']);
      assert.strictEqual(await response.text(), 'PUT media/logo.png');
    });
  });
}
