import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import { once } from 'node:events';
import handleMcpHttpRequest from './handleMcpHttpRequest.ts';
import { toWebRequest, sendWebResponse } from '../http/nodeHttpBridge.ts';
import type { Context } from '../context.ts';

// End-to-end over a real socket with a body-parsing server (like express/fastify):
// the request stream is fully drained before the bridge runs, which is exactly the
// condition under which a wrongly-wired abort signal cancels every SDK exchange.

const context = {
  user: { _id: 'admin-1', roles: ['admin'] },
  modules: {
    languages: { findLanguages: async () => [{ isoCode: 'de', isActive: true }] },
    countries: { findCountries: async () => [{ isoCode: 'CH', isActive: true }] },
    currencies: { findCurrencies: async () => [{ isoCode: 'CHF', isActive: true, decimals: 2 }] },
  },
} as unknown as Context;

let server: http.Server;
let baseUrl: string;

before(async () => {
  server = http.createServer(async (req, res) => {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(chunk as Buffer); // drain like a body parser
    const parsedBody = chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : undefined;
    const bodyText = parsedBody !== undefined ? JSON.stringify(parsedBody) : undefined;
    const response = await handleMcpHttpRequest(context, toWebRequest(req, res, bodyText), parsedBody);
    await sendWebResponse(res, response);
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  baseUrl = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
});

after(() => {
  server.close();
});

const post = async (body: unknown, headers: Record<string, string> = {}) =>
  fetch(`${baseUrl}/mcp`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      accept: 'application/json, text/event-stream',
      ...headers,
    },
    body: JSON.stringify(body),
  });

const parseMcpResponse = async (response: Response) => {
  const text = await response.text();
  if ((response.headers.get('content-type') || '').includes('text/event-stream')) {
    const dataLines = text.split('\n').filter((line) => line.startsWith('data:'));
    return JSON.parse(dataLines[dataLines.length - 1].slice(5));
  }
  return text ? JSON.parse(text) : null;
};

describe('handleMcpHttpRequest over a real socket', () => {
  it('rejects an authenticated request with an untrusted Host header', async () => {
    const body = { jsonrpc: '2.0', id: 0, method: 'tools/list', params: {} };
    const response = await handleMcpHttpRequest(
      context,
      new Request('http://evil.example/mcp', {
        method: 'POST',
        headers: {
          host: 'evil.example',
          'content-type': 'application/json',
          accept: 'application/json, text/event-stream',
        },
        body: JSON.stringify(body),
      }),
      body,
    );
    assert.strictEqual(response.status, 403);
  });

  it('rejects an authenticated browser request from an untrusted Origin', async () => {
    const body = { jsonrpc: '2.0', id: 0, method: 'tools/list', params: {} };
    const response = await handleMcpHttpRequest(
      context,
      new Request('http://localhost/mcp', {
        method: 'POST',
        headers: {
          host: 'localhost',
          origin: 'https://evil.example',
          'content-type': 'application/json',
          accept: 'application/json, text/event-stream',
        },
        body: JSON.stringify(body),
      }),
      body,
    );
    assert.strictEqual(response.status, 403);
  });

  it('serves a legacy-era (2025) tools/list', async () => {
    const response = await post({ jsonrpc: '2.0', id: 1, method: 'tools/list' });
    assert.strictEqual(response.status, 200);
    const message = await parseMcpResponse(response);
    assert.strictEqual(message.result.tools.length, 9);
  });

  it('serves a modern-era (2026-07-28) tools/list — pre-drained body must not abort it', async () => {
    // Regression: the modern era checks the request signal before dispatch; an abort
    // signal wired to the request stream's 'close' turned every modern request into
    // an empty 499 response.
    const response = await post(
      {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/list',
        params: {
          _meta: {
            'io.modelcontextprotocol/protocolVersion': '2026-07-28',
            'io.modelcontextprotocol/clientInfo': { name: 'test', version: '1.0.0' },
            'io.modelcontextprotocol/clientCapabilities': {},
          },
        },
      },
      { 'mcp-protocol-version': '2026-07-28', 'mcp-method': 'tools/list' },
    );
    assert.strictEqual(response.status, 200);
    const message = await parseMcpResponse(response);
    assert.strictEqual(message.result.tools.length, 9);
  });

  it('serves a modern-era tools/call', async () => {
    const response = await post(
      {
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: {
          name: 'localization_management',
          arguments: { action: 'NOT_A_REAL_ACTION' },
          _meta: {
            'io.modelcontextprotocol/protocolVersion': '2026-07-28',
            'io.modelcontextprotocol/clientInfo': { name: 'test', version: '1.0.0' },
            'io.modelcontextprotocol/clientCapabilities': {},
          },
        },
      },
      {
        'mcp-protocol-version': '2026-07-28',
        'mcp-method': 'tools/call',
        'mcp-name': 'localization_management',
      },
    );
    assert.strictEqual(response.status, 200);
    const message = await parseMcpResponse(response);
    assert.strictEqual(message.result.isError, true); // SDK-level validation still answers
  });
});
