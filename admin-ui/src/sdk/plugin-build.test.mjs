import test from 'node:test';
import assert from 'node:assert/strict';

import { definePluginConfig } from './plugin-build.mjs';

test('definePluginConfig emits native ESM browser bundles with a .js extension', () => {
  const config = definePluginConfig('bookmark-manager');
  const outputExtension = config.outExtension?.({ format: 'esm' });

  assert.deepEqual(config.format, ['esm']);
  assert.equal(config.platform, 'browser');
  assert.equal(config.splitting, false);
  assert.equal(outputExtension?.js, '.js');
});
