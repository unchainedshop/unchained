import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import sharedContext from '../modules/common/utils/sharedContext.ts';

// The SDK bundles its own copies of the admin-ui modules. Contexts whose providers the host app
// renders (modals, app, auth, theme) must be the host's instances, or SDK hooks in plugins read
// the default value: "No ModalContext/ModalWrapper ancestor found".
test('the first instance of a shared context wins, later copies get it', () => {
  const previous = globalThis.window;
  globalThis.window = {};
  try {
    const host = { name: 'host ModalContext' };
    const sdkCopy = { name: 'sdk ModalContext' };
    assert.equal(sharedContext('ModalContext', host), host);
    assert.equal(sharedContext('ModalContext', sdkCopy), host);
    assert.equal(sharedContext('AppContext', sdkCopy), sdkCopy);
  } finally {
    globalThis.window = previous;
  }
});

test('without a window (server rendering) every copy keeps its own context', () => {
  const context = { name: 'context' };
  assert.equal(sharedContext('ModalContext', context), context);
});

test('the contexts with host providers are shared', () => {
  for (const [file, name] of [
    ['modal/utils/ModalContext.ts', 'ModalContext'],
    ['common/components/AppContext.tsx', 'AppContext'],
    ['Auth/AuthContext.ts', 'AuthContext'],
    ['common/components/ThemeWrapper.tsx', 'ThemeContext'],
    ['common/components/FormWrapper.tsx', 'FormWrapperContext'],
    ['forms/lib/FormContext.ts', 'FormContext'],
  ]) {
    const source = readFileSync(new URL(`../modules/${file}`, import.meta.url), 'utf8');
    assert.match(source, new RegExp(`sharedContext\\(\\s*'${name}'`), file);
  }
});
