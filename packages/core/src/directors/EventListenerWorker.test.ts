import assert from 'node:assert';
import { describe, it } from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';
import { debounce } from './EventListenerWorker.ts';

describe('EventListenerWorker debounce', () => {
  it('coalesces a burst of calls into a single trailing run', async () => {
    let runs = 0;
    const debounced = debounce(async () => {
      runs += 1;
    }, 20);

    debounced();
    debounced();
    debounced();
    await delay(100);

    assert.strictEqual(runs, 1);
  });

  it('never runs concurrently and re-runs once for triggers received mid-pass', async () => {
    let active = 0;
    let maxActive = 0;
    let runs = 0;
    const debounced = debounce(async () => {
      active += 1;
      maxActive = Math.max(maxActive, active);
      runs += 1;
      await delay(60);
      active -= 1;
    }, 10);

    debounced(); // schedule the first pass
    await delay(40); // the first pass is now running (~60ms)
    debounced(); // arrives mid-pass: must not start a concurrent pass
    debounced();
    await delay(250);

    assert.strictEqual(maxActive, 1, 'the function must never run concurrently');
    assert.ok(runs >= 2, 'a trailing pass must run for triggers received mid-pass');
  });

  it('cancel() prevents a pending run', async () => {
    let runs = 0;
    const debounced = debounce(async () => {
      runs += 1;
    }, 20);

    debounced();
    debounced.cancel();
    await delay(60);

    assert.strictEqual(runs, 0);
  });
});
