import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { pluginRegistry, type PluginHttpRoute } from '@unchainedshop/core';
import { getAuditContext } from '@unchainedshop/events';
import {
  getCurrentContextResolver,
  setCurrentContextResolver,
  type UnchainedContextResolver,
} from '../context.ts';
import { createFetchHandler } from './createFetchHandler.ts';

const routes: PluginHttpRoute[] = [
  {
    path: '/files/:directory/:name',
    method: 'ALL',
    handler: async (request, { params, userId }) =>
      Response.json({ method: request.method, params, userId, audit: getAuditContext()?.userId }),
  },
  {
    path: '/headers',
    method: 'GET',
    handler: async (_request, context) => {
      context.setHeader('x-from-context', 'context');
      context.setHeader('cache-control', 'no-store');
      return new Response('ok', { headers: { 'cache-control': 'public' } });
    },
  },
  {
    path: '/redirect',
    method: 'GET',
    handler: async (_request, context) => {
      context.setHeader('x-from-context', 'context');
      return Response.redirect('https://shop.test/', 302);
    },
  },
  {
    path: '/throws',
    method: 'POST',
    handler: async () => {
      throw new Error('mongodb://user:secret@db');
    },
  },
];

const graphqlHandler = {
  graphqlEndpoint: '/graphql',
  handleRequest: async (_request: Request, { unchainedContext }: any) =>
    Response.json({ data: { me: unchainedContext.userId, params: unchainedContext.params ?? null } }),
} as any;

const request = (path: string, init?: RequestInit) => new Request(`http://shop.test${path}`, init);

describe('createFetchHandler', () => {
  // Context resolver and plugin registry belong to a platform in the same process: suite hooks
  // (not file-level ones, which become hooks of the whole run) restore them
  let previousResolver: UnchainedContextResolver;
  let restoreRegistry: () => void;
  let handler: ReturnType<typeof createFetchHandler>;

  before(() => {
    previousResolver = getCurrentContextResolver();
    setCurrentContextResolver(
      async (params) =>
        ({
          ...params,
          userId: params.getHeader('x-test-user'),
          loaders: {},
        }) as any,
    );
    restoreRegistry = pluginRegistry.clear();
    pluginRegistry.register({ key: 'test.routes', label: 'Routes', version: '1.0.0', routes });
    handler = createFetchHandler({ graphqlHandler });
  });

  after(() => {
    restoreRegistry();
    setCurrentContextResolver(previousResolver);
  });

  it('matches literal segments and decoded parameters with an optional trailing slash', async () => {
    const response = await handler(
      request('/files/media%20files/logo.png/', { method: 'PUT', headers: { 'x-test-user': 'u1' } }),
    );
    assert.deepEqual(await response!.json(), {
      method: 'PUT',
      params: { directory: 'media files', name: 'logo.png' },
      userId: 'u1',
      audit: 'u1',
    });
    assert.equal(await handler(request('/files/media')), undefined);
    assert.equal(await handler(request('/files/media/logo.png/extra')), undefined);
    assert.equal(await handler(request('/files/%E0%A4%A/logo.png')), undefined);
  });

  it('answers HEAD with GET routes and skips routes of other methods', async () => {
    assert.equal((await handler(request('/headers', { method: 'HEAD' })))!.status, 200);
    assert.equal(await handler(request('/headers', { method: 'POST' })), undefined);
  });

  it('passes the request context to GraphQL', async () => {
    const response = await handler(
      request('/graphql', { method: 'POST', headers: { 'x-test-user': 'u2' } }),
    );
    // No route params: Yoga merges the context into its own, which has GraphQL params
    assert.deepEqual(await response!.json(), { data: { me: 'u2', params: null } });
  });

  it('adds the headers set through the context without overriding the response', async () => {
    const response = await handler(request('/headers'));
    assert.equal(response!.headers.get('x-from-context'), 'context');
    assert.equal(response!.headers.get('cache-control'), 'public');

    const redirect = await handler(request('/redirect'));
    assert.equal(redirect!.status, 302);
    assert.equal(redirect!.headers.get('location'), 'https://shop.test/');
    assert.equal(redirect!.headers.get('x-from-context'), 'context');
  });

  it('answers a failing route with a generic error', async () => {
    const response = await handler(request('/throws', { method: 'POST' }));
    assert.equal(response!.status, 500);
    assert.deepEqual(await response!.json(), { error: 'Internal Server Error' });
  });

  it('leaves other requests to the server', async () => {
    assert.equal(await handler(request('/unknown')), undefined);
  });

  it('adds the development CORS headers only where allowed', async () => {
    const devHandler = createFetchHandler(
      { graphqlHandler },
      { allowRemoteToLocalhostSecureCookies: true },
    );
    const response = await devHandler(
      request('/headers', { headers: { origin: 'https://sandbox.test' } }),
    );
    assert.equal(response!.headers.get('access-control-allow-origin'), 'https://sandbox.test');
    assert.equal(response!.headers.get('access-control-allow-private-network'), 'true');

    const { NODE_ENV } = process.env;
    process.env.NODE_ENV = 'production';
    try {
      assert.throws(() =>
        createFetchHandler({ graphqlHandler }, { allowRemoteToLocalhostSecureCookies: true }),
      );
    } finally {
      process.env.NODE_ENV = NODE_ENV;
    }
  });
});
