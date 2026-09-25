import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { build } from 'tsup';

import { definePluginConfig, handleExternals } from './plugin-build.mjs';

test('definePluginConfig emits native ESM browser bundles with a .js extension', () => {
  const config = definePluginConfig('bookmark-manager');
  const outputExtension = config.outExtension?.({ format: 'esm' });

  assert.deepEqual(config.format, ['esm']);
  assert.equal(config.platform, 'browser');
  assert.equal(config.splitting, false);
  assert.equal(outputExtension?.js, '.js');
});

test('handleExternals keeps shared dependencies external when bundled CJS require()s them', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'admin-ui-externals-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  writeFileSync(
    join(dir, 'legacy.cjs'),
    "const React = require('react');\nmodule.exports = React.useRef;\n",
  );
  writeFileSync(
    join(dir, 'index.js'),
    "import useRef from './legacy.cjs';\nexport default useRef;\n",
  );

  await build({
    entry: { index: join(dir, 'index.js') },
    format: ['esm'],
    platform: 'browser',
    outDir: join(dir, 'dist'),
    config: false,
    silent: true,
    esbuildPlugins: [handleExternals(['react'])],
  });

  const output = readFileSync(join(dir, 'dist', 'index.js'), 'utf-8');
  // tsup's `external` option would emit __require("react"), which throws in the browser.
  assert.doesNotMatch(output, /__require\(["']react["']\)/);
  assert.match(output, /from ["']react["']/);
});
