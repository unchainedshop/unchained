import { after, before, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert';
import { MongoClient, type Db } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { getEmitAdapter, setEmitAdapter } from '@unchainedshop/events';
import { configureUsersModule, type UsersModule } from './configureUsersModule.ts';
import { userSettings } from '../users-settings.ts';

describe('login code challenges', () => {
  let server: MongoMemoryServer | undefined;
  let client: MongoClient;
  let db: Db;
  let users: UsersModule;
  // A shared-process run (npm test) has a running platform: restore its settings afterwards
  let configured: typeof userSettings;
  let previousEmitAdapter: ReturnType<typeof getEmitAdapter>;
  const published: { eventName: string; payload: any }[] = [];
  const previousSecret = process.env.UNCHAINED_TOKEN_SECRET;
  const secret = previousSecret || 'login-code-test-secret-that-is-long-enough';

  const configureLoginCode = (loginCode = {}) =>
    userSettings.configureSettings(
      { autoMessagingAfterUserCreation: false, loginCode: { enabled: true, ...loginCode } },
      db,
    );

  const challenges = () => db.collection('accounts_login_code_challenges');

  before(async () => {
    configured = { ...userSettings };
    // Keeps the mails of these challenges away from the platform of a shared-process run
    previousEmitAdapter = getEmitAdapter();
    setEmitAdapter({
      publish: (eventName, { payload }) => published.push({ eventName, payload }),
      subscribe: () => undefined,
    });
    // Use MONGO_URL (npm test shares the run's MongoDB), else start a server of its own
    server = process.env.MONGO_URL ? undefined : await MongoMemoryServer.create();
    client = await MongoClient.connect(process.env.MONGO_URL || server!.getUri());
    db = client.db('users-login-code-test');
    const migrations = new Map();
    users = await configureUsersModule({
      db,
      migrationRepository: {
        db,
        migrations,
        register(migration) {
          migrations.set(migration.id, migration);
        },
        allMigrations: () => Array.from(migrations.values()),
      },
      options: { autoMessagingAfterUserCreation: false },
    });
  });

  beforeEach(async () => {
    process.env.UNCHAINED_TOKEN_SECRET = secret;
    configureLoginCode();
    await Promise.all([challenges().deleteMany({}), db.collection('users').deleteMany({})]);
  });

  after(async () => {
    setEmitAdapter(previousEmitAdapter);
    Object.assign(userSettings, configured);
    if (previousSecret === undefined) delete process.env.UNCHAINED_TOKEN_SECRET;
    else process.env.UNCHAINED_TOKEN_SECRET = previousSecret;
    await client?.close();
    await server?.stop();
  });

  it('stores keyed hashes of the token and the code, never the secrets', async () => {
    const created = await users.loginCode.createChallenge({ userId: 'u1', email: ' User@Example.com ' });
    assert.ok(created);
    const { challenge, token, code } = created;

    assert.match(token, /^[0-9a-f]{64}$/);
    assert.match(code, /^\d{6}$/);
    assert.strictEqual(challenge.email, 'user@example.com');
    assert.deepStrictEqual(published.at(-1), {
      eventName: 'USER_ACCOUNT_ACTION',
      payload: {
        action: 'login-code',
        userId: 'u1',
        address: 'user@example.com',
        token,
        code,
        expiresInMinutes: 15,
      },
    });

    const stored = await challenges().findOne({ _id: challenge._id as any });
    const serialized = JSON.stringify(stored);
    assert.ok(!serialized.includes(token));
    assert.ok(!serialized.includes(`"${code}"`));
    assert.match(stored!.tokenHash, /^[0-9a-f]{64}$/);
    assert.match(stored!.codeHash, /^[0-9a-f]{64}$/);
    assert.strictEqual(stored!.attempts, 0);
    // 15 minutes valid, kept for the 60 minute request window
    assert.strictEqual(stored!.expires.getTime() - stored!.created.getTime(), 15 * 60 * 1000);
    assert.strictEqual(stored!.purgeAt.getTime() - stored!.created.getTime(), 60 * 60 * 1000);
  });

  it('honours the configured code length', async () => {
    configureLoginCode({ codeLength: 8 });
    const created = await users.loginCode.createChallenge({ userId: 'u1', email: 'a@example.com' });
    assert.match(created!.code, /^\d{8}$/);
  });

  it('consumes a challenge once with its token', async () => {
    const { token, code } = (await users.loginCode.createChallenge({
      userId: 'u1',
      email: 'a@example.com',
    }))!;

    const consumed = await users.loginCode.consumeChallenge({ token });
    assert.strictEqual(consumed?.userId, 'u1');
    assert.ok(consumed?.consumed instanceof Date);

    assert.strictEqual(await users.loginCode.consumeChallenge({ token }), null);
    assert.strictEqual(await users.loginCode.consumeChallenge({ email: 'a@example.com', code }), null);
  });

  it('consumes a challenge once with the address and the code', async () => {
    const { token, code } = (await users.loginCode.createChallenge({
      userId: 'u1',
      email: 'a@example.com',
    }))!;
    const grouped = `${code.slice(0, 3)} ${code.slice(3)}`;

    const consumed = await users.loginCode.consumeChallenge({ email: ' A@Example.com', code: grouped });
    assert.strictEqual(consumed?.userId, 'u1');
    assert.strictEqual(consumed?.attempts, 1);

    assert.strictEqual(await users.loginCode.consumeChallenge({ email: 'a@example.com', code }), null);
    assert.strictEqual(await users.loginCode.consumeChallenge({ token }), null);
  });

  it('binds the code to the address it was sent to', async () => {
    const { code } = (await users.loginCode.createChallenge({ userId: 'u1', email: 'a@example.com' }))!;
    assert.strictEqual(await users.loginCode.consumeChallenge({ email: 'b@example.com', code }), null);
    assert.strictEqual(await users.loginCode.consumeChallenge({ email: '', code }), null);
    assert.strictEqual(await users.loginCode.consumeChallenge({ email: 'a@example.com' }), null);
  });

  it('voids the link and the code after maxAttempts wrong codes', async () => {
    const { token, code } = (await users.loginCode.createChallenge({
      userId: 'u1',
      email: 'a@example.com',
    }))!;
    const wrong = code === '000000' ? '000001' : '000000';

    for (let i = 0; i < 5; i++) {
      assert.strictEqual(
        await users.loginCode.consumeChallenge({ email: 'a@example.com', code: wrong }),
        null,
      );
    }
    assert.strictEqual((await challenges().findOne({}))!.attempts, 5);

    assert.strictEqual(await users.loginCode.consumeChallenge({ email: 'a@example.com', code }), null);
    assert.strictEqual(await users.loginCode.consumeChallenge({ token }), null);
  });

  it('counts parallel guesses atomically', async () => {
    const { code } = (await users.loginCode.createChallenge({ userId: 'u1', email: 'a@example.com' }))!;
    const guesses = Array.from({ length: 30 }, (_, i) => String(i).padStart(6, '0')).filter(
      (guess) => guess !== code,
    );

    const results = await Promise.all(
      guesses.map((guess) => users.loginCode.consumeChallenge({ email: 'a@example.com', code: guess })),
    );
    assert.ok(results.every((result) => result === null));
    assert.strictEqual((await challenges().findOne({}))!.attempts, 5);
    assert.strictEqual(await users.loginCode.consumeChallenge({ email: 'a@example.com', code }), null);
  });

  it('refuses expired challenges', async () => {
    const { token, code } = (await users.loginCode.createChallenge({
      userId: 'u1',
      email: 'a@example.com',
    }))!;
    await challenges().updateMany({}, { $set: { expires: new Date(Date.now() - 1000) } });

    assert.strictEqual(await users.loginCode.consumeChallenge({ token }), null);
    assert.strictEqual(await users.loginCode.consumeChallenge({ email: 'a@example.com', code }), null);
  });

  it('refuses challenges hashed with another secret', async () => {
    const { token } = (await users.loginCode.createChallenge({ userId: 'u1', email: 'a@example.com' }))!;
    process.env.UNCHAINED_TOKEN_SECRET = 'another-secret-that-is-long-enough-for-tokens';
    assert.strictEqual(await users.loginCode.consumeChallenge({ token }), null);
  });

  it('voids the open challenges of the user and of the address on a new one', async () => {
    const first = (await users.loginCode.createChallenge({ userId: 'u1', email: 'a@example.com' }))!;
    const otherAddress = (await users.loginCode.createChallenge({
      userId: 'u1',
      email: 'b@example.com',
    }))!;
    const otherUser = (await users.loginCode.createChallenge({ userId: 'u2', email: 'b@example.com' }))!;

    assert.strictEqual(await users.loginCode.consumeChallenge({ token: first.token }), null);
    assert.strictEqual(await users.loginCode.consumeChallenge({ token: otherAddress.token }), null);
    assert.strictEqual(
      (await users.loginCode.consumeChallenge({ token: otherUser.token }))?.userId,
      'u2',
    );
  });

  it('voids the open challenges of a user on request', async () => {
    const { token } = (await users.loginCode.createChallenge({ userId: 'u1', email: 'a@example.com' }))!;
    assert.strictEqual(await users.loginCode.voidChallenges({ userId: 'u1' }), 1);
    assert.strictEqual(await users.loginCode.voidChallenges({}), 0);
    assert.strictEqual(await users.loginCode.consumeChallenge({ token }), null);
  });

  it('voids the open challenges of a user who removes an address', async () => {
    await db.collection('users').insertOne({
      _id: 'u1' as any,
      emails: [
        { address: 'a@example.com', verified: true },
        { address: 'b@example.com', verified: true },
      ],
    });
    const { code } = (await users.loginCode.createChallenge({ userId: 'u1', email: 'a@example.com' }))!;
    const otherUser = (await users.loginCode.createChallenge({ userId: 'u2', email: 'c@example.com' }))!;

    // Not an address of the user, nothing changes
    await users.removeEmail('u1', 'c@example.com');
    assert.strictEqual(await challenges().countDocuments({ voided: null }), 2);

    await users.removeEmail('u1', 'A@example.com');
    assert.strictEqual(await users.loginCode.consumeChallenge({ email: 'a@example.com', code }), null);
    assert.strictEqual(
      (await users.loginCode.consumeChallenge({ token: otherUser.token }))?.userId,
      'u2',
    );
  });

  it('creates at most maxChallengesPerWindow challenges per address and per user', async () => {
    configureLoginCode({ maxChallengesPerWindow: 2 });

    assert.ok(await users.loginCode.createChallenge({ userId: 'u1', email: 'a@example.com' }));
    assert.ok(await users.loginCode.createChallenge({ userId: 'u1', email: 'a@example.com' }));
    assert.strictEqual(
      await users.loginCode.createChallenge({ userId: 'u1', email: 'A@example.com' }),
      null,
    );
    // The same user through another address, and another user through the same address
    assert.strictEqual(
      await users.loginCode.createChallenge({ userId: 'u1', email: 'b@example.com' }),
      null,
    );
    assert.strictEqual(
      await users.loginCode.createChallenge({ userId: 'u2', email: 'a@example.com' }),
      null,
    );
    assert.ok(await users.loginCode.createChallenge({ userId: 'u2', email: 'b@example.com' }));

    // Challenges outside the window no longer count
    await challenges().updateMany({}, { $set: { created: new Date(Date.now() - 61 * 60 * 1000) } });
    assert.ok(await users.loginCode.createChallenge({ userId: 'u1', email: 'a@example.com' }));
  });
});
