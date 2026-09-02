import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';
import {
  PLUGIN_EXTERNALS,
  SDK_ENTRY_KEYS,
  SHARED_DEP_SHIMS,
} from './plugin-runtime.mjs';
import * as pluginAPI from './plugins.mjs';

test('shares react-hook-form instead of the removed Formik runtime', () => {
  assert.equal(SHARED_DEP_SHIMS['react-hook-form'], 'shims/react-hook-form.js');
  assert.equal('formik' in SHARED_DEP_SHIMS, false);
  assert.equal(PLUGIN_EXTERNALS.includes('react-hook-form'), true);
  assert.equal(PLUGIN_EXTERNALS.includes('formik'), false);
});

test('exposes the same runtime graph to import and require consumers', () => {
  const require = createRequire(import.meta.url);
  const commonJSRuntime = require('@unchainedshop/admin-ui/plugin-runtime');

  assert.deepEqual(commonJSRuntime.SHARED_DEP_SHIMS, SHARED_DEP_SHIMS);
  assert.deepEqual(commonJSRuntime.SDK_ENTRY_KEYS, SDK_ENTRY_KEYS);
});

test('makes every host plugin API export visible to shim generation', () => {
  assert.deepEqual(Object.keys(pluginAPI).sort(), ['definePlugin', 'usePluginRuntime']);
  assert.throws(
    () => pluginAPI.usePluginRuntime(),
    /only available inside an admin-ui plugin component/,
  );
});
