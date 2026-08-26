import { after, describe, it } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import { once } from 'node:events';
import express from 'express';
import Fastify from 'fastify';
import { MockLanguageModelV4 } from 'ai/test';
import { connectChat as connectExpressChat } from '../express/chatHandler.ts';
import { connectChat as connectFastifyChat } from '../fastify/chatHandler.ts';
import handleMcpHttpRequest from '../mcp/handleMcpHttpRequest.ts';
import { sendWebResponse, toWebRequest } from '../mcp/nodeHttpBridge.ts';
import type { Context } from '../context.ts';

const servers: http.Server[] = [];
const fastifyApps: ReturnType<typeof Fastify>[] = [];

const listen = async (handler: http.RequestListener) => {
  const server = http.createServer(handler);
  servers.push(server);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  return `http://127.0.0.1:${(server.address() as { port: number }).port}`;
};

after(async () => {
  await Promise.all(fastifyApps.map((app) => app.close()));
  await Promise.all(
    servers.map(
      (server) =>
        new Promise<void>((resolve) => {
          server.close(() => resolve());
        }),
    ),
  );
});

const adminContext = { user: { _id: 'admin', roles: ['admin'] } } as unknown as Context;

const expressChatApp = async (chatConfiguration: any, context: Context | null = adminContext) => {
  const app = express();
  app.use((req, _res, next) => {
    (req as any).unchainedContext = context;
    next();
  });
  connectExpressChat(app, chatConfiguration);
  return listen(app);
};

const fastifyChatApp = async (chatConfiguration: any, context: Context | null = adminContext) => {
  const app = Fastify();
  fastifyApps.push(app);
  app.addHook('onRequest', async (req) => {
    (req as any).unchainedContext = context;
  });
  connectFastifyChat(app, chatConfiguration);
  return app.listen({ port: 0, host: '127.0.0.1' });
};

const unavailableMcpServer = () =>
  listen((_req, res) => {
    res.writeHead(503, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ error: 'unavailable' }));
  });

const availableMcpServer = () => {
  const context = adminContext;
  return listen(async (req, res) => {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(chunk as Buffer);
    const parsedBody = chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : undefined;
    const bodyText = parsedBody === undefined ? undefined : JSON.stringify(parsedBody);
    const response = await handleMcpHttpRequest(context, toWebRequest(req, res, bodyText), parsedBody);
    await sendWebResponse(res, response);
  });
};

const slowModel = () => {
  let modelSignal: AbortSignal | undefined;
  let stopSource: (() => void) | undefined;
  let markStarted: () => void;
  const started = new Promise<void>((resolve) => {
    markStarted = resolve;
  });
  const model = new MockLanguageModelV4({
    doStream: (options) => {
      modelSignal = options.abortSignal;
      markStarted();
      let controller: ReadableStreamDefaultController<any>;
      const stream = new ReadableStream({
        start(streamController) {
          controller = streamController;
          controller.enqueue({ type: 'stream-start', warnings: [] });
          controller.enqueue({
            type: 'response-metadata',
            id: 'response-1',
            modelId: 'mock-model',
            timestamp: new Date(),
          });
          controller.enqueue({ type: 'text-start', id: 'text-1' });
        },
        async pull() {
          await new Promise((resolve) => setTimeout(resolve, 10));
          controller.enqueue({ type: 'text-delta', id: 'text-1', delta: 'x' });
        },
      });
      stopSource = () => {
        try {
          controller.enqueue({ type: 'text-end', id: 'text-1' });
          controller.enqueue({
            type: 'finish',
            finishReason: { unified: 'stop', raw: undefined },
            usage: {
              inputTokens: { total: 1, noCache: 1, cacheRead: 0, cacheWrite: 0 },
              outputTokens: { total: 1, text: 1, reasoning: 0 },
            },
          });
          controller.close();
        } catch {
          // The downstream stream may already have been cancelled by the disconnect.
        }
      };
      return Promise.resolve({ stream });
    },
  });
  return {
    model,
    started,
    get signal() {
      return modelSignal;
    },
    stop() {
      stopSource?.();
    },
  };
};

const assertDisconnectAbortsGeneration = async (
  chatUrl: string,
  state: ReturnType<typeof slowModel>,
) => {
  const controller = new AbortController();
  let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
  try {
    const response = await fetch(`${chatUrl}/chat`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        messages: [{ id: 'message-1', role: 'user', parts: [{ type: 'text', text: 'hello' }] }],
      }),
      signal: controller.signal,
    });
    reader = response.body!.getReader();
    await reader.read();
    await state.started;
    controller.abort();
    await new Promise((resolve) => setTimeout(resolve, 50));
    assert.strictEqual(state.signal?.aborted, true);
  } finally {
    controller.abort();
    state.stop();
    await reader?.cancel().catch(() => undefined);
  }
};

describe('chat auth gating', () => {
  // The MCP endpoint is never contacted on rejected requests, so a dead URL suffices.
  const deadMcpConfig = { model: {}, unchainedMCPUrl: 'http://127.0.0.1:9/mcp' } as any;
  const nonAdminContext = { user: { _id: 'shopper', roles: ['consumer'] } } as unknown as Context;

  it('rejects anonymous requests with 401 in the Express chat adapter', async () => {
    const chatUrl = await expressChatApp(deadMcpConfig, null);
    const response = await fetch(`${chatUrl}/chat/tools`);
    assert.strictEqual(response.status, 401);
  });

  it('rejects anonymous requests with 401 in the Fastify chat adapter', async () => {
    const chatUrl = await fastifyChatApp(deadMcpConfig, null);
    const response = await fetch(`${chatUrl}/chat/tools`);
    assert.strictEqual(response.status, 401);
  });

  it('rejects non-admin requests with 403 in the Express chat adapter', async () => {
    const chatUrl = await expressChatApp(deadMcpConfig, nonAdminContext);
    const response = await fetch(`${chatUrl}/chat`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ messages: [] }),
    });
    assert.strictEqual(response.status, 403);
  });

  it('rejects non-admin requests with 403 in the Fastify chat adapter', async () => {
    const chatUrl = await fastifyChatApp(deadMcpConfig, nonAdminContext);
    const response = await fetch(`${chatUrl}/chat`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ messages: [] }),
    });
    assert.strictEqual(response.status, 403);
  });
});

describe('chat MCP failure handling', () => {
  it('preserves an MCP 503 through the Express chat adapter', async () => {
    const mcpUrl = await unavailableMcpServer();
    const chatUrl = await expressChatApp({ model: {}, unchainedMCPUrl: `${mcpUrl}/mcp` });

    const response = await fetch(`${chatUrl}/chat/tools`);
    assert.strictEqual(response.status, 503);
  });

  it('preserves an MCP 503 through the Fastify chat adapter', async () => {
    const mcpUrl = await unavailableMcpServer();
    const chatUrl = await fastifyChatApp({ model: {}, unchainedMCPUrl: `${mcpUrl}/mcp` });

    const response = await fetch(`${chatUrl}/chat/tools`);
    assert.strictEqual(response.status, 503);
  });
});

describe('chat disconnect handling', () => {
  it('aborts Express model generation when the HTTP client disconnects', async () => {
    const mcpUrl = await availableMcpServer();
    const state = slowModel();
    const chatUrl = await expressChatApp({ model: state.model, unchainedMCPUrl: `${mcpUrl}/mcp` });
    await assertDisconnectAbortsGeneration(chatUrl, state);
  });

  it('aborts Fastify model generation when the HTTP client disconnects', async () => {
    const mcpUrl = await availableMcpServer();
    const state = slowModel();
    const chatUrl = await fastifyChatApp({ model: state.model, unchainedMCPUrl: `${mcpUrl}/mcp` });
    await assertDisconnectAbortsGeneration(chatUrl, state);
  });
});
