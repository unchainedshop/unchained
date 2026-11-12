import { describe, it, mock } from 'node:test';
import assert from 'node:assert';
import { LoginCodeWorker } from './adapter.ts';

describe('LoginCodeWorker', () => {
  it('sends the code of the address through services.users.sendLoginCode', async () => {
    for (const sent of [true, false]) {
      const sendLoginCode = mock.fn(async () => sent);
      const unchainedAPI = { services: { users: { sendLoginCode } } } as any;

      const result = await LoginCodeWorker.doWork(
        { email: 'user@example.com' },
        unchainedAPI,
        'work-id',
      );

      assert.deepStrictEqual(result, { success: true, result: { sent } });
      assert.deepStrictEqual(sendLoginCode.mock.calls[0].arguments, ['user@example.com']);
    }
  });
});
