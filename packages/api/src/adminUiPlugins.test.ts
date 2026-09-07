import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import {
  buildImportMapTag,
  injectAdminUIImportMap,
  prepareAdminUIHTML,
  resolveAdminUIHTML,
} from './adminUiPlugins.ts';

const writePage = (root: string, route: string, name: string) => {
  const directory = route === '/' ? root : join(root, route.slice(1));
  mkdirSync(directory, { recursive: true });
  writeFileSync(
    join(directory, 'index.html'),
    `<html><head><title>${name}</title></head><body>${name}</body></html>`,
  );
};

test('resolves route-specific static export HTML before using fallbacks', (t) => {
  const root = mkdtempSync(join(tmpdir(), 'unchained-admin-ui-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));

  writePage(root, '/', 'root');
  writePage(root, '/products', 'products');
  writePage(root, '/orders', 'orders');
  writePage(root, '/ext/[[...slug]]', 'extension');

  const prepared = prepareAdminUIHTML(root);

  assert.match(resolveAdminUIHTML(prepared, '/'), /<title>root<\/title>/);
  assert.match(resolveAdminUIHTML(prepared, '/products'), /<title>products<\/title>/);
  assert.match(resolveAdminUIHTML(prepared, '/products/'), /<title>products<\/title>/);
  assert.match(resolveAdminUIHTML(prepared, '/admin/products/', '/admin'), /<title>products<\/title>/);
  assert.match(resolveAdminUIHTML(prepared, '/orders/?status=OPEN'), /<title>orders<\/title>/);
  assert.match(resolveAdminUIHTML(prepared, '/ext'), /<title>extension<\/title>/);
  assert.match(resolveAdminUIHTML(prepared, '/ext/bookmarks/123'), /<title>extension<\/title>/);
  assert.match(resolveAdminUIHTML(prepared, '/unknown'), /<title>root<\/title>/);
});

test('normalizes slash-heavy routes and mount prefixes', (t) => {
  const root = mkdtempSync(join(tmpdir(), 'unchained-admin-ui-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  writePage(root, '/', 'root');
  writePage(root, '/products', 'products');
  const prepared = prepareAdminUIHTML(root);
  const slashes = '/'.repeat(50_000);

  assert.match(
    resolveAdminUIHTML(prepared, `/admin/products${slashes}?q=test`, `${slashes}admin${slashes}`),
    /<title>products<\/title>/,
  );
  assert.match(resolveAdminUIHTML(prepared, `/products${slashes}unknown`), /<title>root<\/title>/);
  assert.match(resolveAdminUIHTML(prepared, slashes), /<title>root<\/title>/);
});

test('injects import-map tags with an optional CSP nonce', (t) => {
  const root = mkdtempSync(join(tmpdir(), 'unchained-admin-ui-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  writePage(root, '/', 'root');
  writePage(root, '/products', 'products');
  const prepared = prepareAdminUIHTML(root);
  const importMap = JSON.stringify({ imports: { react: '/admin-ui-sdk/react.js' } });
  const tag = buildImportMapTag(importMap, 'request-nonce');
  const html = injectAdminUIImportMap(prepared, '/products/', tag);

  assert.match(html, /<title>products<\/title>/);
  assert.ok(html.includes(`${tag}</head>`));
  assert.ok(
    injectAdminUIImportMap(prepared, '/', buildImportMapTag(importMap)).includes(
      `<script type="importmap" data-unchained-admin-ui>${importMap}</script></head>`,
    ),
  );
});
