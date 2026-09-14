import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { once } from 'node:events';
import test from 'node:test';

for (const scenario of [
  {
    name: 'accepts a successful GraphQL response',
    status: 200,
    body: { data: { shopInfo: { _id: 'shop' } } },
    expected: 0,
  },
  {
    name: 'rejects GraphQL errors in an HTTP 200 response',
    status: 200,
    body: { errors: [{ message: 'Unavailable' }] },
    expected: 1,
  },
  {
    name: 'rejects unsuccessful HTTP responses',
    status: 503,
    body: { data: { shopInfo: { _id: 'shop' } } },
    expected: 1,
  },
  { name: 'rejects an unrelated JSON response', status: 200, body: {}, expected: 1 },
]) {
  test(scenario.name, async (t) => {
    let request;
    const server = createServer(async (req, res) => {
      let body = '';
      for await (const chunk of req) body += chunk;
      request = { method: req.method, url: req.url, body: JSON.parse(body) };
      res.writeHead(scenario.status, { 'content-type': 'application/json' });
      res.end(JSON.stringify(scenario.body));
    });
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    t.after(() => server.close());
    const child = spawn(process.execPath, [new URL('./healthcheck.mjs', import.meta.url).pathname], {
      env: { ...process.env, PORT: String(server.address().port), GRAPHQL_API_PATH: '/custom-graphql' },
      stdio: 'inherit',
    });
    const [code] = await once(child, 'exit');
    assert.equal(code, scenario.expected);
    assert.deepEqual(request, {
      method: 'POST',
      url: '/custom-graphql',
      body: { query: '{ shopInfo { _id } }' },
    });
  });
}
