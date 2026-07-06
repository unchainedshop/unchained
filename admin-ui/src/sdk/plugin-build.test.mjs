import test from 'node:test';
import assert from 'node:assert/strict';

import { definePluginConfig } from './plugin-build.mjs';

test('definePluginConfig emits browser plugin bundles with a .global.js extension', () => {
  const config = definePluginConfig('bookmark-manager');
  const outputExtension = config.outExtension?.({ format: 'iife' });

  assert.equal(outputExtension?.js, '.global.js');
});
