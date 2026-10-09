import assert from 'node:assert/strict';
import { after, describe, it } from 'node:test';
import { createServer, type Server } from 'node:http';
import express from 'express';
import Fastify from 'fastify';
import { getAuditContext } from '@unchainedshop/events';
import type { PluginHttpRoute, UnchainedCore } from '@unchainedshop/core';
import { mountRoutes as mountExpressRoutes } from '../express/mountRoutes.ts';
import { mountRoutes as mountFastifyRoutes } from '../fastify/mountRoutes.ts';

const unchainedCore = {
  modules: {},
  services: {},
  bulkImporter: {},
  bulkExporter: {},
  options: {},
} as unknown as UnchainedCore;

const route: PluginHttpRoute = {
  path: '/plugin/:id',
  method: 'POST',
  handler: async (request, context) =>
    Response.json(
      {
        body: await request.json(),
        header: context.getHeader('x-test-header'),
        id: context.params.id,
        userId: getAuditContext()?.userId,
      },
      { status: 201, headers: { 'x-plugin-response': 'shared' } },
    ),
};

const emptyBodyRoute: PluginHttpRoute = {
  path: '/plugin-empty',
  method: 'POST',
  handler: async (request) => Response.json({ body: await request.text() }),
};

const requestContext = {
  getHeader: (name: string) => (name.toLowerCase() === 'x-test-header' ? 'request-value' : undefined),
  setHeader: () => undefined,
  locale: new Intl.Locale('en-CH'),
  countryCode: 'CH',
  currencyCode: 'CHF',
};

describe('plugin HTTP routes', () => {
  const servers: Server[] = [];
  const fastify = Fastify();

  after(async () => {
    await Promise.all(
      servers.map((server) => new Promise<void>((resolve) => server.close(() => resolve()))),
    );
    await fastify.close();
  });

  it('writes the returned web response through Express', async () => {
    const app = express();
    app.use((request, _response, next) => {
      (request as any).unchainedContext = requestContext;
      (request as any)._auditContext = { userId: 'express-user' };
      next();
    });
    mountExpressRoutes(app, unchainedCore, [route, emptyBodyRoute]);

    const server = createServer(app);
    servers.push(server);
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();
    assert(address && typeof address === 'object');

    const response = await fetch(`http://127.0.0.1:${address.port}/plugin/express-id`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-test-header': 'request-value' },
      body: JSON.stringify({ transport: 'express' }),
    });

    assert.equal(response.status, 201);
    assert.equal(response.headers.get('x-plugin-response'), 'shared');
    assert.deepEqual(await response.json(), {
      body: { transport: 'express' },
      header: 'request-value',
      id: 'express-id',
      userId: 'express-user',
    });

    const emptyResponse = await fetch(`http://127.0.0.1:${address.port}/plugin-empty`, {
      method: 'POST',
    });
    assert.equal(emptyResponse.status, 200);
    assert.deepEqual(await emptyResponse.json(), { body: '' });
  });

  it('uses a body parsed by middleware mounted before the Express routes', async () => {
    const app = express();
    app.use(express.json());
    app.use((request, _response, next) => {
      (request as any).unchainedContext = requestContext;
      next();
    });
    mountExpressRoutes(app, unchainedCore, [route]);

    const server = createServer(app);
    servers.push(server);
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();
    assert(address && typeof address === 'object');

    const response = await fetch(`http://127.0.0.1:${address.port}/plugin/parsed`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ parsed: true }),
    });

    assert.equal(response.status, 201);
    assert.deepEqual((await response.json()).body, { parsed: true });
  });

  it('writes the returned web response through Fastify', async () => {
    fastify.decorateRequest('unchainedContext');
    fastify.addHook('onRequest', async (request) => {
      (request as any).unchainedContext = requestContext;
      (request as any)._auditContext = { userId: 'fastify-user' };
    });
    mountFastifyRoutes(fastify, unchainedCore, [route, emptyBodyRoute]);
    await fastify.ready();

    const response = await fastify.inject({
      method: 'POST',
      url: '/plugin/fastify-id',
      headers: { 'content-type': 'application/json', 'x-test-header': 'request-value' },
      payload: { transport: 'fastify' },
    });

    assert.equal(response.statusCode, 201);
    assert.equal(response.headers['x-plugin-response'], 'shared');
    assert.deepEqual(response.json(), {
      body: { transport: 'fastify' },
      header: 'request-value',
      id: 'fastify-id',
      userId: 'fastify-user',
    });

    const emptyResponse = await fastify.inject({ method: 'POST', url: '/plugin-empty' });
    assert.equal(emptyResponse.statusCode, 200);
    assert.deepEqual(emptyResponse.json(), { body: '' });
  });
});
