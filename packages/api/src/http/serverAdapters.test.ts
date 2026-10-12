import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import http2 from 'node:http2';
import { once } from 'node:events';
import express from 'express';
import Fastify, { type FastifyInstance, type FastifyReply, type FastifyRequest } from 'fastify';
import { pluginRegistry, type PluginHttpRoute } from '@unchainedshop/core';
import { getAuditContext } from '@unchainedshop/events';
import {
  getCurrentContextResolver,
  setCurrentContextResolver,
  type UnchainedContextResolver,
} from '../context.ts';
import { connect as connectExpress } from '../express/index.ts';
import { connect as connectFastify } from '../fastify/index.ts';
import { connect as connectNode } from '../node/index.ts';
import createGraphQLServer from '../createGraphQLServer.ts';

const routes: PluginHttpRoute[] = [
  {
    path: '/files/:directory/:name',
    method: 'ALL',
    handler: async (request, { params }) => Response.json({ url: request.url, params }),
  },
  {
    path: '/echo',
    method: 'POST',
    handler: async (request) =>
      Response.json({
        contentType: request.headers.get('content-type'),
        text: await request.text(),
        audit: getAuditContext()?.userId,
      }),
  },
  {
    // Like the OIDC back-channel logout: form-urlencoded, some providers send JSON
    path: '/logout-token',
    method: 'POST',
    handler: async (request) => {
      const contentType = request.headers.get('content-type') || '';
      const token = contentType.includes('application/x-www-form-urlencoded')
        ? (await request.formData()).get('logout_token')
        : ((await request.json()) as { logout_token?: string }).logout_token;
      return Response.json({ token });
    },
  },
  {
    path: '/info',
    method: 'GET',
    handler: async (request, { userId }) => Response.json({ url: request.url, userId }),
  },
];

const graphqlHandler = await createGraphQLServer({
  typeDefs: ['type Query { me: String, audit: String } type Mutation { touch: String }'],
  resolvers: [
    {
      Query: {
        me: (_root: unknown, _args: unknown, context: any) => {
          context.setHeader('x-from-context', 'set');
          return context.userId;
        },
        audit: () => getAuditContext()?.userId,
      },
      Mutation: { touch: () => 'touched' },
    },
  ],
});
const platform = { graphqlHandler };

const query = '{ me audit }';
const postGraphQL = (base: string, body = JSON.stringify({ query }), contentType = 'application/json') =>
  fetch(`${base}/graphql`, {
    method: 'POST',
    headers: { 'content-type': contentType, 'x-test-user': 'u9' },
    body,
  });

// The request context reaches the resolvers, which run as its user
const assertGraphQL = async (response: Response) => {
  assert.equal(response.headers.get('x-from-context'), 'set');
  assert.deepEqual(await response.json(), { data: { me: 'u9', audit: 'u9' } });
};

// fetch() refuses CONNECT, TRACE and TRACK, scanners send them all the same
const traceStatus = (base: string, path: string) =>
  new Promise<number>((resolve, reject) => {
    const url = new URL(path, base);
    http
      .request({ host: url.hostname, port: url.port, path: url.pathname, method: 'TRACE' }, (res) => {
        res.resume();
        resolve(res.statusCode!);
      })
      .on('error', reject)
      .end();
  });

const servers: http.Server[] = [];
const fastifyApps: FastifyInstance[] = [];
let contextsCreated = 0;

const listen = async (listener?: http.RequestListener) => {
  const server = http.createServer(listener);
  servers.push(server);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  return { server, base: `http://127.0.0.1:${(server.address() as { port: number }).port}` };
};

const expressApp = async (setup?: (app: express.Express) => void) => {
  const app = express();
  setup?.(app);
  await connectExpress(app, platform);
  app.get('/app-route', (req, res) => {
    res.json({ userId: req.unchainedContext?.userId, audit: getAuditContext()?.userId });
  });
  return (await listen(app)).base;
};

describe('server adapters', () => {
  // Context resolver and plugin registry belong to a platform in the same process: suite hooks
  // (not file-level ones, which become hooks of the whole run) restore them
  let previousResolver: UnchainedContextResolver;
  let restoreRegistry: () => void;

  before(() => {
    previousResolver = getCurrentContextResolver();
    setCurrentContextResolver(async (params) => {
      contextsCreated += 1;
      return { ...params, userId: params.getHeader('x-test-user'), loaders: {} } as any;
    });
    restoreRegistry = pluginRegistry.clear();
    pluginRegistry.register({ key: 'test.routes', label: 'Routes', version: '1.0.0', routes });
  });

  after(async () => {
    restoreRegistry();
    setCurrentContextResolver(previousResolver);
    await Promise.all(fastifyApps.map((app) => app.close()));
    for (const server of servers) {
      server.closeAllConnections();
      server.close();
    }
  });

  describe('Express adapter', () => {
    it('keeps the full URL and parameters of ALL routes', async () => {
      const base = await expressApp();
      const response = await fetch(`${base}/files/media/logo.png?s=sig`, { method: 'PUT', body: 'x' });
      assert.deepEqual(await response.json(), {
        url: `${base}/files/media/logo.png?s=sig`,
        params: { directory: 'media', name: 'logo.png' },
      });
    });

    it('takes the protocol of a trusted proxy', async () => {
      const base = await expressApp((app) => app.set('trust proxy', true));
      const response = await fetch(`${base}/info`, { headers: { 'x-forwarded-proto': 'https' } });
      assert.match((await response.json()).url, /^https:\/\//);
    });

    it('streams the body as sent without a body parser, as the user of the request', async () => {
      const base = await expressApp();
      const raw = '{ "id": "evt_1",  "spaced": true }';
      const response = await fetch(`${base}/echo`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-test-user': 'u4' },
        body: raw,
      });
      assert.deepEqual(await response.json(), {
        contentType: 'application/json',
        text: raw,
        audit: 'u4',
      });
    });

    it('passes on bodies of app-wide body parsers', async () => {
      const base = await expressApp((app) => {
        app.use(express.json());
        app.use(express.urlencoded());
      });
      const form = await fetch(`${base}/logout-token`, {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: 'logout_token=abc.def',
      });
      assert.deepEqual(await form.json(), { token: 'abc.def' });

      const body = JSON.stringify({ ignored: true });
      const status = await new Promise<number>((resolve, reject) => {
        const url = new URL(`${base}/info`);
        http
          .request(
            {
              host: url.hostname,
              port: url.port,
              path: url.pathname,
              headers: { 'content-type': 'application/json', 'content-length': Buffer.byteLength(body) },
            },
            (res) => {
              res.resume();
              resolve(res.statusCode!);
            },
          )
          .on('error', reject)
          .end(body);
      });
      assert.equal(status, 200);
    });

    it('answers GraphQL with Yoga, also after an app-wide body parser', async () => {
      await assertGraphQL(await postGraphQL(await expressApp()));
      await assertGraphQL(await postGraphQL(await expressApp((app) => app.use(express.json()))));
    });

    it('gives routes of the app the request context', async () => {
      const base = await expressApp();
      const response = await fetch(`${base}/app-route`, { headers: { 'x-test-user': 'u1' } });
      assert.deepEqual(await response.json(), { userId: 'u1', audit: 'u1' });
    });

    it('leaves methods a web request cannot carry to the app and Yoga', async () => {
      const base = await expressApp();
      assert.equal(await traceStatus(base, '/info'), 404);
      assert.equal(await traceStatus(base, '/graphql'), 405);
    });
  });

  describe('Fastify adapter', () => {
    const fastifyApp = async (options: Parameters<typeof Fastify>[0] = {}) => {
      const app = Fastify(options as any) as unknown as FastifyInstance;
      fastifyApps.push(app);
      // An app-wide wildcard, e.g. @fastify/static serving a storefront
      app.get('/*', async () => ({ wildcard: true }));
      app.get('/app-route', async (request) => ({
        userId: request.unchainedContext?.userId,
        audit: getAuditContext()?.userId,
      }));
      await connectFastify(app, platform);
      await app.listen({ port: 0, host: '127.0.0.1' });
      return `http://127.0.0.1:${(app.server.address() as { port: number }).port}`;
    };

    it('routes the engine endpoints past app wildcards and reads the body as sent', async () => {
      const base = await fastifyApp();
      const raw = '{ "id": "evt_1",  "spaced": true }';
      const response = await fetch(`${base}/echo`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-test-user': 'u5' },
        body: raw,
      });
      assert.deepEqual(await response.json(), {
        contentType: 'application/json',
        text: raw,
        audit: 'u5',
      });
      assert.deepEqual(await (await fetch(`${base}/files/media/logo.png`)).json(), {
        url: `${base}/files/media/logo.png`,
        params: { directory: 'media', name: 'logo.png' },
      });
      assert.deepEqual(await (await fetch(`${base}/elsewhere`)).json(), { wildcard: true });
    });

    it('answers GraphQL with bodies of the Fastify parsers', async () => {
      await assertGraphQL(await postGraphQL(await fastifyApp()));
    });

    it('applies the body limit and content types of Fastify to GraphQL', async () => {
      const base = await fastifyApp({ bodyLimit: 1024 });
      const large = JSON.stringify({ query, variables: { pad: 'x'.repeat(2048) } });
      assert.equal((await postGraphQL(base, large)).status, 413);
      const mutation = `query=${encodeURIComponent('mutation { touch }')}`;
      assert.equal((await postGraphQL(base, mutation, 'application/x-www-form-urlencoded')).status, 415);
      assert.equal((await postGraphQL(base, mutation, 'text/plain')).status, 415);
    });

    it('runs the hooks of the app and its plugins for the engine endpoints', async () => {
      const app = Fastify() as unknown as FastifyInstance;
      fastifyApps.push(app);
      const blockOn = (header: string) => async (request: FastifyRequest, reply: FastifyReply) => {
        if (request.headers[header]) return reply.code(429).send({ blocked: header });
      };
      // Like @fastify/rate-limit, a plugin without encapsulation that hooks into every route
      const routeHooks = Object.assign(
        async (instance: FastifyInstance) => {
          instance.addHook('onRoute', (route) => {
            route.onRequest = blockOn('x-route-hook');
          });
        },
        { [Symbol.for('skip-override')]: true },
      );
      app.register(routeHooks);
      app.addHook('preHandler', blockOn('x-pre-handler'));
      await connectFastify(app, platform);
      app.addHook('onRequest', blockOn('x-late'));
      await app.listen({ port: 0, host: '127.0.0.1' });
      const base = `http://127.0.0.1:${(app.server.address() as { port: number }).port}`;

      for (const path of ['/graphql', '/echo', '/mcp']) {
        for (const header of ['x-route-hook', 'x-pre-handler', 'x-late']) {
          const response = await fetch(`${base}${path}`, {
            method: 'POST',
            headers: { 'content-type': 'application/json', [header]: '1' },
            body: JSON.stringify({ query }),
          });
          assert.equal(response.status, 429, `${header} on ${path}`);
        }
      }
      assert.equal((await fetch(`${base}/info`)).status, 200);
    });

    it('gives routes of the app the request context', async () => {
      const base = await fastifyApp();
      const response = await fetch(`${base}/app-route`, { headers: { 'x-test-user': 'u2' } });
      assert.deepEqual(await response.json(), { userId: 'u2', audit: 'u2' });
    });

    it('serves the Admin UI behind the routes of the app without a request context', async () => {
      const app = Fastify() as unknown as FastifyInstance;
      fastifyApps.push(app);
      app.get('/app-route', async () => ({ app: true }));
      app.setNotFoundHandler(async (_request, reply) => reply.code(404).send({ notFound: 'app' }));
      await connectFastify(app, platform, { adminUI: true });
      await app.listen({ port: 0, host: '127.0.0.1' });
      const base = `http://127.0.0.1:${(app.server.address() as { port: number }).port}`;

      const before = contextsCreated;
      const theme = await fetch(`${base}/admin-ui-theme.css`, { headers: { 'x-test-user': 'u6' } });
      assert.equal(theme.headers.get('content-type'), 'text/css; charset=utf-8');
      assert.equal((await fetch(`${base}/admin-ui-theme.css`, { method: 'HEAD' })).status, 200);
      assert.equal(contextsCreated, before);
      assert.deepEqual(await (await fetch(`${base}/app-route`)).json(), { app: true });
      assert.deepEqual(await (await fetch(`${base}/missing-chunk.js`)).json(), { notFound: 'app' });
    });

    it('leaves methods a web request cannot carry to the app', async () => {
      const base = await fastifyApp();
      assert.equal(await traceStatus(base, '/info'), 404);
      assert.equal(await traceStatus(base, '/graphql'), 404);
    });

    it('serves HTTP/2', async () => {
      const base = await fastifyApp({ http2: true });
      const client = http2.connect(base);
      try {
        const result = await new Promise<{ status: number; body: string }>((resolve, reject) => {
          const stream = client.request({
            ':method': 'POST',
            ':path': '/echo',
            'content-type': 'text/plain',
          });
          let status = 0;
          let body = '';
          stream.on('response', (headers) => {
            status = Number(headers[':status']);
          });
          stream.setEncoding('utf8');
          stream.on('data', (chunk) => {
            body += chunk;
          });
          stream.on('end', () => resolve({ status, body }));
          stream.on('error', reject);
          stream.end('over h2');
        });
        assert.equal(result.status, 200);
        assert.deepEqual(JSON.parse(result.body), { contentType: 'text/plain', text: 'over h2' });
      } finally {
        client.close();
      }
    });
  });

  describe('Node adapter', () => {
    it('serves the engine from a plain HTTP server', async () => {
      const { server, base } = await listen();
      await connectNode(server, platform);
      const response = await fetch(`${base}/info`, { headers: { 'x-test-user': 'u3' } });
      assert.deepEqual(await response.json(), { url: `${base}/info`, userId: 'u3' });
      assert.equal((await fetch(`${base}/unknown`)).status, 404);
    });

    it('answers methods a web request cannot carry with a 404', async () => {
      const { server, base } = await listen();
      await connectNode(server, platform);
      assert.equal(await traceStatus(base, '/info'), 404);
      assert.equal(await traceStatus(base, '/graphql'), 404);
      assert.equal((await fetch(`${base}/info`)).status, 200);
    });

    it('answers GraphQL', async () => {
      const { server, base } = await listen();
      await connectNode(server, platform);
      await assertGraphQL(await postGraphQL(base));

      const fromQueryString = await fetch(`${base}/graphql?query=${encodeURIComponent(query)}`, {
        headers: { accept: 'application/json', 'x-test-user': 'u9' },
      });
      await assertGraphQL(fromQueryString);

      // Without a content-length the body is streamed to Yoga
      const streamed = await fetch(`${base}/graphql`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-test-user': 'u9' },
        body: ReadableStream.from([new TextEncoder().encode(JSON.stringify({ query }))]),
        duplex: 'half',
      } as RequestInit);
      await assertGraphQL(streamed);

      assert.equal((await postGraphQL(base, '{ invalid json')).status, 400);
    });
  });
});
