import { after, describe, it } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import { once } from 'node:events';
import { MockLanguageModelV4 } from 'ai/test';
import { createChatHandler } from './createChatHandler.ts';
import { sendWebResponse, toWebRequest } from '../http/nodeHttpBridge.ts';
import type { Context } from '../context.ts';

const servers: http.Server[] = [];

const listen = async (handler: http.RequestListener) => {
  const server = http.createServer(handler);
  servers.push(server);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  return `http://127.0.0.1:${(server.address() as { port: number }).port}`;
};

after(async () => {
  await Promise.all(
    servers.map(
      (server) =>
        new Promise<void>((resolve) => {
          server.closeAllConnections();
          server.close(() => resolve());
        }),
    ),
  );
});

const adminContext = { user: { _id: 'admin', roles: ['admin'] } } as unknown as Context;

// The chat over a real socket, through the Node bridge every server adapter uses
const chatServer = async (chatConfiguration: any, context: Context = adminContext) => {
  const chat = createChatHandler(chatConfiguration)!;
  return listen(async (req, res) => {
    await sendWebResponse(res, await chat(toWebRequest(req, res), context));
  });
};

const chatConfig = { model: {} } as any;

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
  const anonymousContext = {} as unknown as Context;
  const nonAdminContext = { user: { _id: 'shopper', roles: ['consumer'] } } as unknown as Context;

  it('rejects anonymous requests with 401', async () => {
    const chatUrl = await chatServer(chatConfig, anonymousContext);
    const response = await fetch(`${chatUrl}/chat/tools`);
    assert.strictEqual(response.status, 401);
  });

  it('rejects non-admin requests with 403', async () => {
    const chatUrl = await chatServer(chatConfig, nonAdminContext);
    const response = await fetch(`${chatUrl}/chat`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ messages: [] }),
    });
    assert.strictEqual(response.status, 403);
  });
});

describe('chat cross-site protection', () => {
  const post = (chatUrl: string, headers: Record<string, string>, body: string) =>
    fetch(`${chatUrl}/chat`, { method: 'POST', headers, body });

  it('rejects bodies that are not JSON with 415', async () => {
    const chatUrl = await chatServer(chatConfig);
    // text/plain needs no CORS preflight, so a page of any site can send it
    const response = await post(
      chatUrl,
      { 'content-type': 'text/plain' },
      JSON.stringify({ messages: [] }),
    );
    assert.strictEqual(response.status, 415);
  });

  it('rejects pages of other sites with 403', async () => {
    const chatUrl = await chatServer(chatConfig);
    const response = await post(
      chatUrl,
      { 'content-type': 'application/json', origin: 'https://evil.example' },
      JSON.stringify({ messages: [] }),
    );
    assert.strictEqual(response.status, 403);
    const tools = await fetch(`${chatUrl}/chat/tools`, { headers: { origin: 'null' } });
    assert.strictEqual(tools.status, 403);
  });

  it('rejects bodies over 10 MB with 413', async () => {
    const chatUrl = await chatServer(chatConfig);
    const response = await post(
      chatUrl,
      { 'content-type': 'application/json' },
      JSON.stringify({ messages: [], padding: 'x'.repeat(10 * 1024 * 1024) }),
    );
    assert.strictEqual(response.status, 413);

    // Without a content-length the bytes are counted while reading
    const chunk = new Uint8Array(6 * 1024 * 1024);
    const streamed = await createChatHandler(chatConfig)!(
      new Request('http://localhost/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: ReadableStream.from([chunk, chunk]),
        duplex: 'half',
      } as RequestInit),
      adminContext,
    );
    assert.strictEqual(streamed.status, 413);
  });

  it('accepts pages of its own host, localhost and the allowed origins', async () => {
    const chatUrl = await chatServer({ model: {}, allowedOrigins: ['https://admin.example.com/'] });
    for (const origin of [chatUrl, 'http://localhost:3000', 'https://admin.example.com']) {
      const response = await fetch(`${chatUrl}/chat/tools`, { headers: { origin } });
      assert.strictEqual(response.status, 200, origin);
    }
    const other = await fetch(`${chatUrl}/chat/tools`, {
      headers: { origin: 'https://admin.example.com.evil.example' },
    });
    assert.strictEqual(other.status, 403);
  });
});

describe('chat MCP', () => {
  it('uses the tools of the engine MCP server in-process', async () => {
    const chatUrl = await chatServer(chatConfig);
    const { tools } = await (await fetch(`${chatUrl}/chat/tools`)).json();
    assert.ok(tools.some(({ name }: { name: string }) => name === 'product_management'));
  });
});

describe('chat disconnect handling', () => {
  it('aborts model generation when the HTTP client disconnects', async () => {
    const state = slowModel();
    const chatUrl = await chatServer({ model: state.model });
    await assertDisconnectAbortsGeneration(chatUrl, state);
  });
});
