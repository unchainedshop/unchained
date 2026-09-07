import assert from 'node:assert';
import test from 'node:test';
import { setupDatabase, disconnect, getServerBaseUrl } from './helpers.js';
import { ADMIN_TOKEN, USER_TOKEN } from './seeds/users.js';

let baseUrl;

const mcpFetch = async (body, { token, method = 'POST', headers = {} } = {}) =>
  fetch(`${baseUrl}/mcp`, {
    method,
    headers: {
      'content-type': 'application/json',
      accept: 'application/json, text/event-stream',
      ...(token ? { authorization: token } : {}),
      ...headers,
    },
    ...(method === 'POST' && body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

// POST answers arrive as application/json or as an SSE stream depending on negotiation —
// parse either and return the last JSON-RPC message.
const parseMcpResponse = async (response) => {
  const contentType = response.headers.get('content-type') || '';
  const text = await response.text();
  if (contentType.includes('text/event-stream')) {
    const dataLines = text.split('\n').filter((line) => line.startsWith('data:'));
    return JSON.parse(dataLines[dataLines.length - 1].slice(5));
  }
  return text ? JSON.parse(text) : null;
};

const rpc = (method, params = {}, id = 1) => ({ jsonrpc: '2.0', id, method, params });

test.describe('MCP server (stateless, SDK v2)', () => {
  test.before(async () => {
    await setupDatabase();
    baseUrl = getServerBaseUrl();
  });

  test.after(async () => {
    await disconnect();
  });

  test('rejects unauthenticated requests with 401 and OAuth resource metadata', async () => {
    const response = await mcpFetch(rpc('initialize'));
    assert.strictEqual(response.status, 401);
    assert.match(response.headers.get('www-authenticate') || '', /Bearer realm="Unchained MCP"/);
    const body = await response.json();
    assert.strictEqual(body.error, 'invalid_token');
    assert.match(body.resource_metadata, /\/\.well-known\/oauth-protected-resource$/);
  });

  test('rejects authenticated non-admin users with 403', async () => {
    const response = await mcpFetch(rpc('initialize'), { token: USER_TOKEN });
    assert.strictEqual(response.status, 403);
    const body = await response.json();
    assert.strictEqual(body.error, 'forbidden');
  });

  test('rejects authenticated browser requests from an untrusted Origin', async () => {
    const response = await mcpFetch(rpc('tools/list'), {
      token: ADMIN_TOKEN,
      headers: { origin: 'https://evil.example' },
    });
    assert.strictEqual(response.status, 403);
    const body = await parseMcpResponse(response);
    assert.match(body.error.message, /Invalid Origin/);
  });

  test('answers initialize statelessly without issuing a session id', async () => {
    const response = await mcpFetch(
      rpc('initialize', {
        protocolVersion: '2025-06-18',
        capabilities: {},
        clientInfo: { name: 'integration-test', version: '1.0.0' },
      }),
      { token: ADMIN_TOKEN },
    );
    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.headers.get('mcp-session-id'), null);
    const message = await parseMcpResponse(response);
    assert.strictEqual(message.result.serverInfo.name, 'Unchained MCP Server');
  });

  test('lists the 9 management tools without requiring a prior initialize', async () => {
    const response = await mcpFetch(rpc('tools/list'), { token: ADMIN_TOKEN });
    assert.strictEqual(response.status, 200);
    const message = await parseMcpResponse(response);
    const names = message.result.tools.map((tool) => tool.name).sort();
    assert.deepStrictEqual(names, [
      'assortment_management',
      'filter_management',
      'localization_management',
      'order_management',
      'product_management',
      'provider_management',
      'quotation_management',
      'system_management',
      'users_management',
    ]);

    // Schema-conversion tripwire: the action enum and zod `describe()` descriptions must
    // survive the zod-mini -> JSON Schema conversion.
    const filterTool = message.result.tools.find((tool) => tool.name === 'filter_management');
    assert.ok(filterTool.inputSchema.properties.action.enum.length > 0);
    assert.strictEqual(
      filterTool.inputSchema.properties.limit.description,
      'Maximum number of results to return',
    );
    assert.ok(filterTool.description.startsWith('Comprehensive filter management'));

    const usersTool = message.result.tools.find((tool) => tool.name === 'users_management');
    const supportedUserActions = usersTool.inputSchema.properties.action.enum;
    for (const action of supportedUserActions) {
      assert.match(usersTool.description, new RegExp(`\\b${action}\\b`));
    }
    for (const unsupportedAction of ['SET_ROLES', 'SET_PASSWORD', 'GET_CART']) {
      assert.doesNotMatch(usersTool.description, new RegExp(`\\b${unsupportedAction}\\b`));
    }
  });

  test('executes a tool call end-to-end', async () => {
    const response = await mcpFetch(
      rpc('tools/call', { name: 'system_management', arguments: { action: 'SHOP_INFO' } }),
      { token: ADMIN_TOKEN },
    );
    assert.strictEqual(response.status, 200);
    const message = await parseMcpResponse(response);
    assert.notStrictEqual(message.result.isError, true);
    assert.strictEqual(message.result.content[0].type, 'text');
    assert.doesNotThrow(() => JSON.parse(message.result.content[0].text));
  });

  test('flags an unknown action as a tool error', async () => {
    const response = await mcpFetch(
      rpc('tools/call', { name: 'system_management', arguments: { action: 'NOT_A_REAL_ACTION' } }),
      { token: ADMIN_TOKEN },
    );
    assert.strictEqual(response.status, 200);
    const message = await parseMcpResponse(response);
    assert.strictEqual(message.result.isError, true);
  });

  test('serves the localization resources', async () => {
    const listResponse = await mcpFetch(rpc('resources/list'), { token: ADMIN_TOKEN });
    const listMessage = await parseMcpResponse(listResponse);
    const uris = listMessage.result.resources.map((resource) => resource.uri).sort();
    assert.deepStrictEqual(uris, [
      'unchained://shop/countries',
      'unchained://shop/currencies',
      'unchained://shop/languages',
    ]);

    const readResponse = await mcpFetch(rpc('resources/read', { uri: 'unchained://shop/languages' }), {
      token: ADMIN_TOKEN,
    });
    const readMessage = await parseMcpResponse(readResponse);
    assert.strictEqual(readMessage.result.contents[0].mimeType, 'application/json');
    assert.ok(JSON.parse(readMessage.result.contents[0].text).baseLanguages.length > 0);
  });

  test('returns 405 for GET (no standalone SSE stream in stateless mode)', async () => {
    const response = await mcpFetch(undefined, {
      token: ADMIN_TOKEN,
      method: 'GET',
      headers: { accept: 'text/event-stream' },
    });
    assert.strictEqual(response.status, 405);
  });

  test('rejects malformed JSON bodies with a 4xx, not a 5xx', async () => {
    const response = await fetch(`${baseUrl}/mcp`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json, text/event-stream',
        authorization: ADMIN_TOKEN,
      },
      body: '{"jsonrpc": "2.0", "method": ',
    });
    assert.ok(response.status >= 400 && response.status < 500, `got ${response.status}`);
  });

  test('@ai-sdk/mcp connects and derives the tool set (chat loopback path)', async () => {
    const { createMCPClient } = await import('@ai-sdk/mcp');
    const client = await createMCPClient({
      transport: {
        type: 'http',
        url: `${baseUrl}/mcp`,
        headers: { authorization: ADMIN_TOKEN },
      },
    });
    try {
      const tools = await client.tools();
      assert.strictEqual(Object.keys(tools).length, 9);
      assert.ok(tools.users_management);
    } finally {
      await client.close();
    }
  });
});
