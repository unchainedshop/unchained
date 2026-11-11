import test from 'node:test';
import assert from 'node:assert';
import { createHash } from 'node:crypto';
import { setupDatabase, createLoggedInGraphqlFetch, disconnect } from './helpers.js';
import { ADMIN_TOKEN, USER_TOKEN, Admin, User } from './seeds/users.js';

const SUPPORT_TOKEN = 'Bearer support-secret';

test.describe('Privileged users', () => {
  let db;
  let asSupport;
  let asAdmin;
  let asUser;

  test.before(async () => {
    [db] = await setupDatabase();
    await db.collection('users').insertOne({
      ...User,
      _id: 'support',
      username: 'support',
      emails: [{ address: 'support@unchained.local', verified: true }],
      roles: ['support'],
      services: {
        token: { secret: createHash('sha256').update('support-secret').digest('hex') },
      },
    });
    asSupport = createLoggedInGraphqlFetch(SUPPORT_TOKEN);
    asAdmin = createLoggedInGraphqlFetch(ADMIN_TOKEN);
    asUser = createLoggedInGraphqlFetch(USER_TOKEN);
  });

  test.after(async () => {
    await disconnect();
  });

  const setRoles = (fetch, userId, roles) =>
    fetch({
      query: /* GraphQL */ `
        mutation setRoles($userId: ID!, $roles: [String!]!) {
          setRoles(userId: $userId, roles: $roles) {
            _id
            roles
          }
        }
      `,
      variables: { userId, roles },
    });

  const errorCode = ({ errors }) => errors?.[0]?.extensions?.code;

  test('a user manager cannot make itself or somebody else admin', async () => {
    assert.strictEqual(errorCode(await setRoles(asSupport, 'support', ['admin'])), 'NoPermissionError');
    assert.strictEqual(errorCode(await setRoles(asSupport, User._id, ['admin'])), 'NoPermissionError');
    const user = await db.collection('users').findOne({ _id: User._id });
    assert.deepStrictEqual(user.roles, []);
  });

  test('a user manager cannot remove the admin role', async () => {
    assert.strictEqual(errorCode(await setRoles(asSupport, Admin._id, [])), 'NoPermissionError');
    const admin = await db.collection('users').findOne({ _id: Admin._id });
    assert.deepStrictEqual(admin.roles, ['admin']);
  });

  test('a user manager cannot change or act as an admin', async () => {
    const mutations = [
      ['setPassword', 'mutation { setPassword(userId: "admin", newPassword: "taken-over") { _id } }'],
      ['setUsername', 'mutation { setUsername(userId: "admin", username: "taken-over") { _id } }'],
      ['setUserTags', 'mutation { setUserTags(userId: "admin", tags: ["x"]) { _id } }'],
      ['addEmail', 'mutation { addEmail(userId: "admin", email: "taken@over.local") { _id } }'],
      [
        'removeEmail',
        'mutation { removeEmail(userId: "admin", email: "admin@unchained.local") { _id } }',
      ],
      [
        'updateUserProfile',
        'mutation { updateUserProfile(userId: "admin", profile: { displayName: "taken-over" }) { _id } }',
      ],
      ['removeUser', 'mutation { removeUser(userId: "admin") { _id } }'],
      ['impersonate', 'mutation { impersonate(userId: "admin") { _id } }'],
      [
        'prepareUserAvatarUpload',
        'mutation { prepareUserAvatarUpload(userId: "admin", mediaName: "a.png") { _id } }',
      ],
    ];
    for (const [name, query] of mutations) {
      assert.strictEqual(errorCode(await asSupport({ query })), 'NoPermissionError', name);
    }
    const admin = await db.collection('users').findOne({ _id: Admin._id });
    assert.strictEqual(admin.username, Admin.username);
    assert.strictEqual(admin.deleted, undefined);
  });

  test('a user manager still manages unprivileged users', async () => {
    const { errors } = await asSupport({
      query: /* GraphQL */ `
        mutation {
          setPassword(userId: "user", newPassword: "reset-by-support") {
            _id
          }
          setUserTags(userId: "user", tags: ["vip"]) {
            _id
          }
        }
      `,
    });
    assert.strictEqual(errors, undefined, JSON.stringify(errors));
    const { data, errors: roleErrors } = await setRoles(asSupport, User._id, ['support']);
    assert.strictEqual(roleErrors, undefined, JSON.stringify(roleErrors));
    assert.deepStrictEqual(data.setRoles.roles, ['support']);
    await setRoles(asSupport, User._id, []);
  });

  test('an admin grants and revokes the admin role', async () => {
    const granted = await setRoles(asAdmin, User._id, ['admin']);
    assert.strictEqual(granted.errors, undefined, JSON.stringify(granted.errors));
    const revoked = await setRoles(asAdmin, User._id, []);
    assert.strictEqual(revoked.errors, undefined, JSON.stringify(revoked.errors));
    assert.deepStrictEqual(revoked.data.setRoles.roles, []);
  });

  test('setPassword does not change the own password', async () => {
    for (const [fetch, userId] of [
      [asUser, User._id],
      [asAdmin, Admin._id],
    ]) {
      const result = await fetch({
        query: /* GraphQL */ `
          mutation setPassword($userId: ID!) {
            setPassword(userId: $userId, newPassword: "without-the-old-one") {
              _id
            }
          }
        `,
        variables: { userId },
      });
      assert.strictEqual(errorCode(result), 'NoPermissionError', userId);
    }
  });

  test('users cannot write their own meta, admins can', async () => {
    const updateMeta = (fetch, userId) =>
      fetch({
        query: /* GraphQL */ `
          mutation updateUserProfile($userId: ID) {
            updateUserProfile(userId: $userId, meta: { priceListId: "b2b" }) {
              _id
            }
          }
        `,
        variables: { userId },
      });
    assert.strictEqual(errorCode(await updateMeta(asUser, User._id)), 'NoPermissionError');
    const byAdmin = await updateMeta(asAdmin, User._id);
    assert.strictEqual(byAdmin.errors, undefined, JSON.stringify(byAdmin.errors));
    const user = await db.collection('users').findOne({ _id: User._id });
    assert.deepStrictEqual(user.meta, { priceListId: 'b2b' });

    const profileOnly = await asUser({
      query: /* GraphQL */ `
        mutation {
          updateUserProfile(profile: { displayName: "Own name" }) {
            _id
          }
        }
      `,
    });
    assert.strictEqual(profileOnly.errors, undefined, JSON.stringify(profileOnly.errors));
  });
});
