import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

// The form fields read their state from the Form provider (FormContext + react-hook-form), so a
// plugin can only use them when the same `form` entry also exports Form.
test('the form entry exports Form next to its fields', () => {
  const source = readFileSync(new URL('../components/ui/form/index.ts', import.meta.url), 'utf8');
  assert.match(source, /export \{ default as Form \} from '..\/..\/..\/modules\/forms\/components\/Form';/);
  assert.match(source, /export \{ default as TextField \}/);
});
