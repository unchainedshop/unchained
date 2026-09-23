import { describe, it, after } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import { once } from 'node:events';
import { setTimeout as sleep } from 'node:timers/promises';
import { toWebRequest, sendWebResponse } from '../http/nodeHttpBridge.ts';

const servers: http.Server[] = [];

const listen = async (handler: http.RequestListener) => {
  const server = http.createServer(handler);
  servers.push(server);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const { port } = server.address() as { port: number };
  return `http://127.0.0.1:${port}`;
};

after(() => {
  for (const server of servers) server.close();
});

describe('toWebRequest', () => {
  it('maps method, url, headers and a pre-serialized body', async () => {
    let captured: Request;
    const base = await listen(async (req, res) => {
      captured = toWebRequest(req, res, JSON.stringify({ hello: 'world' }));
      res.end();
    });
    await fetch(`${base}/mcp?foo=bar`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-custom': 'yes' },
      body: JSON.stringify({ ignored: 'the pre-parsed body wins' }),
    });
    assert.strictEqual(captured!.method, 'POST');
    assert.strictEqual(new URL(captured!.url).pathname, '/mcp');
    assert.strictEqual(new URL(captured!.url).searchParams.get('foo'), 'bar');
    assert.strictEqual(captured!.headers.get('x-custom'), 'yes');
    // The original content-length refers to the raw stream, not the re-serialized body.
    assert.strictEqual(captured!.headers.get('content-length'), null);
    assert.deepStrictEqual(await captured!.json(), { hello: 'world' });
  });

  it('does NOT abort after the request body was already consumed upstream', async () => {
    // Regression: IncomingMessage emits 'close' on normal completion once the body is
    // drained (which the framework's body parser does before the bridge runs). Keying
    // the abort on req 'close' aborted every request immediately — the SDK's modern
    // protocol era answered everything with 499.
    let captured: Request;
    const base = await listen(async (req, res) => {
      for await (const chunk of req) void chunk; // drain, like express.json / fastify do
      captured = toWebRequest(req, res, '{}');
      await sleep(100); // give a wrongly-keyed 'close' abort time to fire
      assert.strictEqual(captured.signal.aborted, false);
      res.end('ok');
    });
    const response = await fetch(`${base}/mcp`, { method: 'POST', body: '{}' });
    assert.strictEqual(await response.text(), 'ok');
    assert.strictEqual(captured!.signal.aborted, false);
  });

  it('aborts the web request when the client disconnects before the response finished', async () => {
    let captured: Request;
    let release: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const base = await listen(async (req, res) => {
      for await (const chunk of req) void chunk;
      captured = toWebRequest(req, res, '{}');
      release();
      // keep the response open so the client can abort mid-flight
      await sleep(1_000);
      res.end();
    });
    const controller = new AbortController();
    const pending = fetch(`${base}/mcp`, {
      method: 'POST',
      body: '{}',
      signal: controller.signal,
    }).catch(() => null);
    await gate;
    assert.strictEqual(captured!.signal.aborted, false);
    controller.abort();
    await pending;
    await sleep(50);
    assert.strictEqual(captured!.signal.aborted, true);
  });

  it('falls back instead of throwing on a malformed Host header', async () => {
    // A pre-auth throw would turn unauthenticated requests into 500s + error logs.
    let captured: Request;
    const base = await listen((req, res) => {
      req.headers.host = 'a b'; // Node's parser delivers these; new URL() would throw
      captured = toWebRequest(req, res, undefined);
      res.end();
    });
    await fetch(base);
    assert.strictEqual(new URL(captured!.url).host, 'localhost');
  });
});

describe('sendWebResponse', () => {
  it('propagates status, headers and set-cookie arrays', async () => {
    const base = await listen(async (req, res) => {
      const headers = new Headers({ 'x-one': '1' });
      headers.append('set-cookie', 'a=1; Path=/');
      headers.append('set-cookie', 'b=2; Path=/');
      await sendWebResponse(res, new Response('"ok"', { status: 201, headers }));
    });
    const response = await fetch(base);
    assert.strictEqual(response.status, 201);
    assert.strictEqual(response.headers.get('x-one'), '1');
    assert.deepStrictEqual(response.headers.getSetCookie(), ['a=1; Path=/', 'b=2; Path=/']);
    assert.strictEqual(await response.text(), '"ok"');
  });

  it('streams SSE chunks progressively instead of buffering the whole body', async () => {
    let releaseSecondChunk: () => void;
    const secondChunkGate = new Promise<void>((resolve) => {
      releaseSecondChunk = resolve;
    });
    const body = new ReadableStream({
      async start(controller) {
        controller.enqueue(new TextEncoder().encode('data: first\n\n'));
        await secondChunkGate;
        controller.enqueue(new TextEncoder().encode('data: second\n\n'));
        controller.close();
      },
    });
    const base = await listen(async (req, res) => {
      await sendWebResponse(
        res,
        new Response(body, { headers: { 'content-type': 'text/event-stream' } }),
      );
    });

    const response = await fetch(base);
    const reader = response.body!.getReader();
    const first = await reader.read();
    // The first chunk must arrive while the source stream is still open.
    assert.match(new TextDecoder().decode(first.value), /data: first/);
    releaseSecondChunk!();
    const second = await reader.read();
    assert.match(new TextDecoder().decode(second.value), /data: second/);
  });

  it('settles and cancels the body when the client is already gone', async () => {
    // Regression: entering sendWebResponse after the response already closed used to
    // wait for events that had already fired — the promise never settled.
    let cancelled = false;
    let handlerDone: Promise<void> | undefined;
    const base = await listen((req, res) => {
      handlerDone = (async () => {
        await once(res, 'close'); // client disconnected before we started responding
        const body = new ReadableStream({
          cancel() {
            cancelled = true;
          },
        });
        await sendWebResponse(res, new Response(body));
      })();
    });
    await assert.rejects(fetch(base, { signal: AbortSignal.timeout(50) }));
    await handlerDone!;
    assert.strictEqual(cancelled, true);
  });

  it('destroys the source stream when the client disconnects mid-stream', async () => {
    let cancelled = false;
    let releaseHandler: () => void;
    const handlerDone = new Promise<void>((resolve) => {
      releaseHandler = resolve;
    });
    const body = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('data: first\n\n'));
        // never closes — only a client disconnect can end this response
      },
      cancel() {
        cancelled = true;
      },
    });
    const base = await listen(async (req, res) => {
      await sendWebResponse(
        res,
        new Response(body, { headers: { 'content-type': 'text/event-stream' } }),
      );
      releaseHandler();
    });

    const controller = new AbortController();
    const response = await fetch(base, { signal: controller.signal });
    await response.body!.getReader().read();
    controller.abort();
    await handlerDone;
    await sleep(50);
    assert.strictEqual(cancelled, true);
  });
});
