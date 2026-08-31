import assert from 'node:assert';
import { describe, it } from 'node:test';
import { executeBulkOperation } from './executeBulkOperation.ts';

describe('executeBulkOperation', () => {
  it('deduplicates IDs and executes operations serially in input order', async () => {
    const calls: string[] = [];

    const result = await executeBulkOperation(['first', 'second', 'first'], async (id) => {
      calls.push(`start:${id}`);
      await Promise.resolve();
      calls.push(`end:${id}`);
      if (id === 'second') throw new Error('failed');
    });

    assert.deepStrictEqual(calls, ['start:first', 'end:first', 'start:second', 'end:second']);
    assert.deepStrictEqual(result, {
      successIds: ['first'],
      failedIds: ['second'],
    });
  });
});
