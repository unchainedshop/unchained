import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toFileName } from './download.ts';

test('toFileName turns event slugs and titles into portable file names', () => {
  assert.equal(toFileName('Première: Faust / Teil 1'), 'premiere-faust-teil-1');
  assert.equal(toFileName('winter-gala_2026'), 'winter-gala_2026');
  assert.equal(toFileName('***'), 'event');
  assert.equal(toFileName('', 'tickets'), 'tickets');
});
