import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { createMigrationRunner } from './createMigrationRunner.ts';

describe('migration runner', () => {
  test('records successful migrations once and propagates a failure before later migrations', async () => {
    const completed: number[] = [];
    const invoked: number[] = [];
    let shouldFail = true;
    const migrations = [20260907120000, 20260907120001, 20260907120002].map((id, index) => ({
      id,
      up: async () => {
        invoked.push(id);
        if (index === 1 && shouldFail) throw new Error('conversion failed');
      },
    }));
    const run = (currentId: number) =>
      createMigrationRunner({
        currentId,
        migrationRepository: { allMigrations: () => migrations },
        onMigrationComplete: async (id: number) => completed.push(id),
        unchainedAPI: {},
      }).run();

    await assert.rejects(run(0), {
      name: 'MigrationError',
      migrationId: 20260907120001,
      message: 'conversion failed',
    });
    assert.deepEqual(completed, [20260907120000]);
    assert.deepEqual(invoked, [20260907120000, 20260907120001]);

    shouldFail = false;
    assert.deepEqual(await run(completed.at(-1)!), [20260907120002, 2]);
    assert.deepEqual(
      completed,
      migrations.map(({ id }) => id),
    );
    assert.deepEqual(await run(completed.at(-1)!), [20260907120002, 0]);
  });
});
