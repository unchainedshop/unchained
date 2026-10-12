import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, sep } from 'node:path';
import { resolveAdminUIPath } from '../adminUiPlugins.ts';
import { createAdminUIHandler } from './createAdminUIHandler.ts';

const root = resolveAdminUIPath();
const built = Boolean(root && existsSync(join(root, 'index.html')));

const requester =
  (serve: ReturnType<typeof createAdminUIHandler>, cspNonce?: string) =>
  (path: string, headers: Record<string, string> = {}) =>
    serve(new Request(`http://shop.test${path}`, { headers }), cspNonce);

describe('createAdminUIHandler', { skip: !built && 'the admin-ui is not built' }, () => {
  const get = requester(createAdminUIHandler());

  it('serves files of the static export with validators', async () => {
    const response = await get('/favicon.svg');
    assert.equal(response!.status, 200);
    assert.equal(response!.headers.get('content-type'), 'image/svg+xml');
    assert.equal(response!.headers.get('cache-control'), 'public, max-age=0');
    const etag = response!.headers.get('etag')!;
    assert.equal((await get('/favicon.svg', { 'if-none-match': etag }))!.status, 304);
  });

  it('caches the content-hashed Next.js assets', async () => {
    const asset = readdirSync(join(root!, '_next', 'static'), { recursive: true })
      .map((file) => String(file).split(sep).join('/'))
      .find((file) => file.endsWith('.js'));
    const response = await get(`/_next/static/${asset}`);
    assert.equal(response!.headers.get('cache-control'), 'public, max-age=31536000, immutable');
    assert.equal(response!.headers.get('content-type'), 'text/javascript; charset=utf-8');
  });

  it('answers client-side routes with their HTML and leaves missing files alone', async () => {
    const page = await get('/products');
    assert.equal(page!.headers.get('content-type'), 'text/html; charset=utf-8');
    assert.match(await page!.text(), /<html/);
    assert.equal(await get('/missing-chunk.js'), undefined);
    assert.equal(await get('/_next/static/chunks/missing.js'), undefined);
  });

  it('answers plugin pages with dots in their path', async () => {
    for (const path of ['/ext/reports.v2', '/ext/ticketing/festival-2.0_id_abc']) {
      const page = await get(path);
      assert.equal(page!.headers.get('content-type'), 'text/html; charset=utf-8', path);
    }
  });

  it('serves no dotfiles and nothing outside the export', async () => {
    assert.equal(await get('/..%2F..%2Fpackage.json'), undefined);
    assert.equal(await get('/.well-known/security.txt'), undefined);
  });

  it('serves the theme stylesheet at the root', async () => {
    const response = await get('/admin-ui-theme.css');
    assert.equal(response!.headers.get('content-type'), 'text/css; charset=utf-8');
    const etag = response!.headers.get('etag')!;
    assert.equal((await get('/admin-ui-theme.css', { 'if-none-match': etag }))!.status, 304);
  });

  it('serves the export below a prefix', async () => {
    const getPrefixed = requester(createAdminUIHandler({ prefix: '/admin' }));
    assert.equal((await getPrefixed('/admin/favicon.svg'))!.status, 200);
    assert.equal(await getPrefixed('/favicon.svg'), undefined);
    assert.equal((await getPrefixed('/admin-ui-theme.css'))!.status, 200);
  });

  it('injects the plugin import map with the CSP nonce of the request', async (t) => {
    const directory = mkdtempSync(join(tmpdir(), 'admin-ui-plugin-'));
    t.after(() => rmSync(directory, { recursive: true, force: true }));
    const bundlePath = join(directory, 'index.js');
    writeFileSync(bundlePath, 'export const Page = () => null;');
    const serve = createAdminUIHandler({ plugins: [{ name: 'test-plugin', bundlePath, slots: {} }] });

    if ((await requester(serve)('/admin-ui-importmap.json')) === undefined) {
      t.skip('the admin-ui SDK is not built');
      return;
    }
    const bundle = await requester(serve)('/admin-plugins/test-plugin.js');
    assert.equal(bundle!.headers.get('content-type'), 'text/javascript; charset=utf-8');
    const html = await (await requester(serve, 'n0nce')('/products'))!.text();
    assert.match(html, /<script type="importmap" data-unchained-admin-ui nonce="n0nce">/);
  });
});
