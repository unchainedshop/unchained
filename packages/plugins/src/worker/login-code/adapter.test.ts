import { describe, it, mock } from 'node:test';
import assert from 'node:assert';
import { LoginCodeWorker } from './adapter.ts';

const createUnchainedAPI = ({
  user = { _id: 'user-id' } as Record<string, any> | null,
  created = true,
} = {}) => {
  const findUserByEmail = mock.fn(async () => user);
  const createChallenge = mock.fn(async ({ userId, email }) =>
    created
      ? { challenge: { _id: 'challenge-id', userId, email }, token: 'TOKEN', code: '123456' }
      : null,
  );
  const unchainedAPI = { modules: { users: { findUserByEmail, loginCode: { createChallenge } } } };
  return { unchainedAPI: unchainedAPI as any, findUserByEmail, createChallenge };
};

describe('LoginCodeWorker', () => {
  it('creates a challenge for the user of the address', async () => {
    const { unchainedAPI, findUserByEmail, createChallenge } = createUnchainedAPI();

    const result = await LoginCodeWorker.doWork({ email: 'user@example.com' }, unchainedAPI, 'work-id');

    assert.deepStrictEqual(result, { success: true, result: { sent: true } });
    assert.deepStrictEqual(findUserByEmail.mock.calls[0].arguments, ['user@example.com']);
    assert.deepStrictEqual(createChallenge.mock.calls[0].arguments, [
      { userId: 'user-id', email: 'user@example.com' },
    ]);
  });

  it('sends nothing for an unknown address or a deleted user', async () => {
    for (const user of [null, { _id: 'user-id', deleted: new Date() }]) {
      const { unchainedAPI, createChallenge } = createUnchainedAPI({ user });

      const result = await LoginCodeWorker.doWork(
        { email: 'user@example.com' },
        unchainedAPI,
        'work-id',
      );

      assert.deepStrictEqual(result, { success: true, result: { sent: false } });
      assert.strictEqual(createChallenge.mock.callCount(), 0);
    }
  });

  it('sends nothing once the address reached the request limit', async () => {
    const { unchainedAPI } = createUnchainedAPI({ created: false });

    const result = await LoginCodeWorker.doWork({ email: 'user@example.com' }, unchainedAPI, 'work-id');

    assert.deepStrictEqual(result, { success: true, result: { sent: false } });
  });
});
