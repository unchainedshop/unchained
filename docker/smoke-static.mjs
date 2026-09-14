import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

const [image, route = '/'] = process.argv.slice(2);
if (!image) throw new Error('Usage: node docker/smoke-static.mjs IMAGE [NESTED_ROUTE]');
const docker = (...args) => execFileSync('docker', args, { encoding: 'utf8' }).trim();
let container;
try {
  container = docker('run', '--detach', '--publish', '127.0.0.1::3000', image);
  const address = docker('port', container, '3000/tcp');
  const origin = `http://${address}`;
  const deadline = Date.now() + 60_000;
  let healthy = false;
  while (Date.now() < deadline) {
    const status = docker('inspect', '--format', '{{.State.Health.Status}}', container);
    if (status === 'healthy') {
      healthy = true;
      break;
    }
    if (status === 'unhealthy') throw new Error('Image health check failed');
    await delay(500);
  }
  assert.ok(healthy, 'Image must become healthy within 60 seconds');
  for (const path of ['/', route]) {
    const response = await fetch(new URL(path, origin));
    assert.equal(response.status, 200, path);
    assert.match(response.headers.get('content-type') ?? '', /text\/html/);
    const html = await response.text();
    const asset = html.match(/<script\b[^>]*\bsrc="([^"]+)"/)?.[1];
    assert.ok(asset, `${path} must load a JavaScript asset`);
    const assetResponse = await fetch(new URL(asset, response.url));
    assert.equal(assetResponse.status, 200, asset);
    assert.match(assetResponse.headers.get('content-type') ?? '', /javascript/);
  }
  const missing = await fetch(`${origin}/missing-${crypto.randomUUID()}`);
  assert.equal(missing.status, 404, 'Unknown paths must return a real 404');
  console.log(`${image}: healthy; root, ${route}, JavaScript assets, and 404 verified`);
} catch (error) {
  if (container) console.error(docker('logs', container));
  throw error;
} finally {
  if (container) docker('rm', '--force', container);
}
