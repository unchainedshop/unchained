import { describe, it, mock } from 'node:test';
import assert from 'node:assert';
import { sendLoginCodeService } from './sendLoginCode.ts';

const createModules = ({
  user = { _id: 'user-id' } as Record<string, any> | null,
  created = true,
} = {}) => {
  const findUserByEmail = mock.fn(async () => user);
  const createChallenge = mock.fn(async ({ userId, email }) =>
    created
      ? { challenge: { _id: 'challenge-id', userId, email }, token: 'TOKEN', code: '123456' }
      : null,
  );
  const modules = { users: { findUserByEmail, loginCode: { createChallenge } } };
  return { modules: modules as any, findUserByEmail, createChallenge };
};

describe('sendLoginCodeService', () => {
  it('creates a challenge for the user of the address', async () => {
    const { modules, findUserByEmail, createChallenge } = createModules();

    assert.strictEqual(await sendLoginCodeService.call(modules, 'user@example.com'), true);
    assert.deepStrictEqual(findUserByEmail.mock.calls[0].arguments, ['user@example.com']);
    assert.deepStrictEqual(createChallenge.mock.calls[0].arguments, [
      { userId: 'user-id', email: 'user@example.com' },
    ]);
  });

  it('sends nothing for an unknown address or a deleted user', async () => {
    for (const user of [null, { _id: 'user-id', deleted: new Date() }]) {
      const { modules, createChallenge } = createModules({ user });

      assert.strictEqual(await sendLoginCodeService.call(modules, 'user@example.com'), false);
      assert.strictEqual(createChallenge.mock.callCount(), 0);
    }
  });

  it('sends to an unverified address only when the account has no login of its own', async () => {
    const cases: [Record<string, any>, boolean][] = [
      [{ services: { password: { pbkdf2: 'hash' } }, emails: [{ address: 'user@example.com' }] }, false],
      [{ services: { password: { bcrypt: 'hash' } }, emails: [{ address: 'user@example.com' }] }, false],
      [
        {
          services: { password: { reset: [{ token: 'hash', address: 'user@example.com' }] } },
          emails: [{ address: 'user@example.com' }],
        },
        true,
      ],
      [
        { services: { webAuthn: [{ id: 'passkey' }] }, emails: [{ address: 'user@example.com' }] },
        false,
      ],
      [
        {
          services: { password: { pbkdf2: 'hash' } },
          emails: [{ address: 'User@Example.com', verified: true }],
        },
        true,
      ],
      [{ services: {}, emails: [{ address: 'user@example.com', verified: false }] }, true],
    ];
    for (const [user, sent] of cases) {
      const { modules } = createModules({ user: { _id: 'user-id', ...user } });

      assert.strictEqual(
        await sendLoginCodeService.call(modules, 'user@example.com'),
        sent,
        JSON.stringify(user),
      );
    }
  });

  it('sends nothing once the address reached the request limit', async () => {
    const { modules } = createModules({ created: false });

    assert.strictEqual(await sendLoginCodeService.call(modules, 'user@example.com'), false);
  });
});
