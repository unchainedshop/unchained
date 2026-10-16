import { after, before, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert';
import { initDb, stopDb } from '@unchainedshop/mongodb';
import type { Db } from 'mongodb';
import { configureUsersModule, type UsersModule } from './configureUsersModule.ts';

let db: Db;
let users: UsersModule;

before(async () => {
  db = await initDb({ forceInMemory: true, port: 0 });
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
  await Promise.all([db.collection('users').deleteMany({}), db.collection('sessions').deleteMany({})]);
});

after(async () => {
  await stopDb();
});

const createUser = async (id: string, roles: string[] = []) => {
  await users.createUser(
    {
      _id: id,
      username: id,
      password: null,
      roles,
    },
    { skipMessaging: true },
  );
};

describe('active administrator invariant', () => {
  it('blocks revoking the admin role from the last active administrator', async () => {
    await createUser('only-admin', ['admin']);

    await assert.rejects(() => users.updateRoles('only-admin', []), { cause: 'LAST_ADMIN' });
    assert.deepStrictEqual((await users.findUserById('only-admin'))?.roles, ['admin']);
  });

  it('blocks deleting the last active administrator', async () => {
    await createUser('only-admin', ['admin']);

    await assert.rejects(() => users.markDeleted('only-admin'), { cause: 'LAST_ADMIN' });
    await assert.rejects(() => users.deletePermanently({ userId: 'only-admin' }), {
      cause: 'LAST_ADMIN',
    });
    assert.strictEqual((await users.findUserById('only-admin'))?.deleted, undefined);
  });

  it('allows deleting non-administrators and removing one of multiple administrators', async () => {
    await createUser('first-admin', ['admin']);
    await createUser('second-admin', ['admin']);
    await createUser('regular-user');

    assert.ok(await users.markDeleted('regular-user'));
    assert.ok(await users.updateRoles('first-admin', []));
    assert.deepStrictEqual((await users.findUserById('second-admin'))?.roles, ['admin']);
  });

  it('does not count deleted administrators as active', async () => {
    await createUser('active-admin', ['admin']);
    await createUser('deleted-admin', ['admin']);
    await db.collection('users').updateOne({ _id: 'deleted-admin' }, { $set: { deleted: new Date() } });

    await assert.rejects(() => users.updateRoles('active-admin', []), { cause: 'LAST_ADMIN' });
  });
});

describe('push subscriptions', () => {
  const subscription = (p256dh: unknown) => ({
    endpoint: 'https://push.example.com/subscription',
    keys: { p256dh, auth: 'auth-secret' },
  });

  it('stores a subscription and deduplicates it by key', async () => {
    await createUser('subscriber');

    await users.addPushSubscription('subscriber', subscription('subscriber-key'), {
      userAgent: 'test',
      unsubscribeFromOtherUsers: false,
    });
    await users.addPushSubscription('subscriber', subscription('subscriber-key'), {
      userAgent: 'test',
      unsubscribeFromOtherUsers: false,
    });

    assert.strictEqual((await users.findUserById('subscriber'))?.pushSubscriptions?.length, 1);
  });

  // `subscription` comes from the JSON scalar, so its key has to be rejected before it reaches the
  // selectors: a query operator there would be evaluated by MongoDB and, with
  // unsubscribeFromOtherUsers, decide which other users get their subscriptions pulled.
  it('rejects a key that is a query operator instead of a string', async () => {
    await createUser('subscriber');
    await createUser('attacker');
    await users.addPushSubscription('subscriber', subscription('subscriber-key'), {
      userAgent: 'test',
      unsubscribeFromOtherUsers: false,
    });

    const cause = await users
      .addPushSubscription('attacker', subscription({ $gt: '' }), {
        userAgent: 'test',
        unsubscribeFromOtherUsers: true,
      })
      .then(
        () => 'resolved',
        (error) => error.cause,
      );

    assert.strictEqual((await users.findUserById('subscriber'))?.pushSubscriptions?.length, 1);
    assert.strictEqual(cause, 'PUSH_SUBSCRIPTION_INVALID');
  });
});
