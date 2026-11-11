import assert from 'node:assert';
import test from 'node:test';
import { setTimeout } from 'node:timers/promises';
import { userSettings } from '@unchainedshop/core-users';
import { setupDatabase, createAnonymousGraphqlFetch, disconnect, tokenCookieOf } from './helpers.js';
import { User } from './seeds/users.js';

let Users;
let Events;
let WorkQueue;
let Challenges;
let anonymousGraphqlFetch;

const REQUEST_LOGIN_CODE = /* GraphQL */ `
  mutation RequestLoginCode($email: String!) {
    requestLoginCode(email: $email)
  }
`;

const LOGIN_WITH_LOGIN_CODE = /* GraphQL */ `
  mutation LoginWithLoginCode($email: String, $code: String, $token: String) {
    loginWithLoginCode(email: $email, code: $code, token: $token) {
      _id
      tokenExpires
      user {
        _id
      }
    }
  }
`;

// A user with an unverified address `${_id}@unchained.local`
const insertUser = async (_id) => {
  await Users.insertOne({
    ...User,
    _id,
    username: _id,
    emails: [{ address: `${_id}@unchained.local`, verified: false }],
    services: {},
  });
  return `${_id}@unchained.local`;
};

// Login codes are disabled by default, enable them (with options) for one test
const enableLoginCode = (t, options = {}) => {
  const configured = userSettings.loginCode;
  userSettings.loginCode = { ...configured, enabled: true, ...options };
  t.after(() => {
    userSettings.loginCode = configured;
  });
};

const requestLoginCode = async (email) => {
  const { data, errors } = await anonymousGraphqlFetch({
    query: REQUEST_LOGIN_CODE,
    variables: { email },
  });
  assert.strictEqual(errors, undefined);
  assert.strictEqual(data.requestLoginCode, true);
};

const loginWithLoginCode = (variables) =>
  anonymousGraphqlFetch({ query: LOGIN_WITH_LOGIN_CODE, variables });

// Waits until `count` LOGIN_CODE works for the address are done, returns them oldest first
const waitForLoginCodeWorks = async (email, count = 1) => {
  for (let i = 0; i < 100; i++) {
    const works = await WorkQueue.find(
      { type: 'LOGIN_CODE', 'input.email': email, finished: { $exists: true } },
      { sort: { created: 1 } },
    ).toArray();
    if (works.length >= count) return works;
    await setTimeout(100);
  }
  throw new Error(`${count} LOGIN_CODE works for ${email} did not finish in time`);
};

// The ACCOUNT_ACTION messages queued for the address
const findLoginCodeMessages = (email) =>
  WorkQueue.find({
    type: 'MESSAGE',
    'input.action': 'login-code',
    'input.recipientEmail': email,
  }).toArray();

// The platform queues the message when the module emits USER_ACCOUNT_ACTION, after the work is done
const waitForLoginCodeMessages = async (email, count = 1) => {
  for (let i = 0; i < 100; i++) {
    const messages = await findLoginCodeMessages(email);
    if (messages.length >= count) return messages;
    await setTimeout(100);
  }
  throw new Error(`${count} login-code messages for ${email} were not queued in time`);
};

// The EMAIL work the ACCOUNT_ACTION template forked for the address
const waitForMail = async (email) => {
  for (let i = 0; i < 100; i++) {
    const work = await WorkQueue.findOne({ type: 'EMAIL', 'input.to': email });
    if (work) return work;
    await setTimeout(100);
  }
  throw new Error(`No mail to ${email}`);
};

// Requests a code and returns the link token and the code of its mail
const requestMailedCode = async (email) => {
  await requestLoginCode(email);
  const [work] = await waitForLoginCodeWorks(email);
  assert.deepStrictEqual(work.result, { sent: true });
  const [message] = await waitForLoginCodeMessages(email);
  return { token: message.input.token, code: message.input.code };
};

const assertInvalidCredentials = ({ data, errors, headers }) => {
  assert.strictEqual(errors?.[0]?.extensions?.code, 'InvalidCredentials');
  assert.strictEqual(data, null);
  assert.strictEqual(tokenCookieOf(headers), undefined);
};

// The event history is written without awaiting it
const findEvent = async (selector) => {
  for (let i = 0; i < 20; i++) {
    const event = await Events.findOne(selector);
    if (event) return event;
    await setTimeout(100);
  }
  throw new Error(`No event matches ${JSON.stringify(selector)}`);
};

test.describe('Login with a code sent by mail', () => {
  test.before(async () => {
    const [db] = await setupDatabase();
    Users = db.collection('users');
    Events = db.collection('events');
    WorkQueue = db.collection('work_queue');
    Challenges = db.collection('accounts_login_code_challenges');
    anonymousGraphqlFetch = createAnonymousGraphqlFetch();
  });

  test.after(async () => {
    await disconnect();
  });

  test('is disabled by default', async (t) => {
    const email = await insertUser('code-disabled');
    assert.strictEqual(userSettings.loginCode.enabled, false);

    await requestLoginCode(email);
    assert.strictEqual(await WorkQueue.countDocuments({ type: 'LOGIN_CODE' }), 0);

    // A code mailed while enabled stops working once disabled
    const configured = userSettings.loginCode;
    userSettings.loginCode = { ...configured, enabled: true };
    const { token, code } = await requestMailedCode(email).finally(() => {
      userSettings.loginCode = configured;
    });
    assertInvalidCredentials(await loginWithLoginCode({ email, code }));
    assertInvalidCredentials(await loginWithLoginCode({ token }));

    enableLoginCode(t);
    const { data } = await loginWithLoginCode({ token });
    assert.strictEqual(data.loginWithLoginCode.user._id, 'code-disabled');
  });

  test('answers an unknown address like a known one and mails nothing', async (t) => {
    enableLoginCode(t);
    const known = await insertUser('code-known');
    const unknown = 'code-unknown@unchained.local';

    const answers = await Promise.all(
      [known, unknown].map((email) =>
        anonymousGraphqlFetch({ query: REQUEST_LOGIN_CODE, variables: { email } }),
      ),
    );
    assert.deepStrictEqual(
      answers.map(({ data, errors, status }) => ({ data, errors, status })),
      [
        { data: { requestLoginCode: true }, errors: undefined, status: 200 },
        { data: { requestLoginCode: true }, errors: undefined, status: 200 },
      ],
    );

    const [unknownWork] = await waitForLoginCodeWorks(unknown);
    assert.deepStrictEqual(unknownWork.result, { sent: false });
    assert.deepStrictEqual(await findLoginCodeMessages(unknown), []);
    assert.strictEqual(await Challenges.countDocuments({ email: unknown }), 0);

    const [knownWork] = await waitForLoginCodeWorks(known);
    assert.deepStrictEqual(knownWork.result, { sent: true });
    assert.strictEqual((await waitForLoginCodeMessages(known)).length, 1);
  });

  test('logs in once with the address and the code, verifies the address', async (t) => {
    enableLoginCode(t, { sessionExpiresInSeconds: 12 * 60 * 60 });
    const email = await insertUser('code-login');

    const { token, code } = await requestMailedCode(email);
    assert.match(code, /^\d{6}$/);

    // The mail carries the link and the code, the database only their hashes
    const mail = await waitForMail(email);
    assert.ok(mail.input.text.includes(`${code.slice(0, 3)} ${code.slice(3)}`));
    assert.ok(mail.input.text.includes(`/login-code?token=${token}`));
    const challenge = await Challenges.findOne({ userId: 'code-login' });
    assert.ok(!JSON.stringify(challenge).includes(token));
    assert.notStrictEqual(challenge.codeHash, code);

    // Typed differently and in groups, as in the mail
    const { data, headers } = await loginWithLoginCode({
      email: ' Code-Login@Unchained.local ',
      code: `${code.slice(0, 3)} ${code.slice(3)}`,
    });
    assert.strictEqual(data.loginWithLoginCode.user._id, 'code-login');
    assert.ok(tokenCookieOf(headers));
    const lifetime = (new Date(data.loginWithLoginCode.tokenExpires).getTime() - Date.now()) / 1000;
    assert.ok(Math.abs(lifetime - 12 * 60 * 60) < 60, `session of ${lifetime}s instead of 12 hours`);
    const user = await Users.findOne({ _id: 'code-login' });
    assert.strictEqual(user.emails[0].verified, true);
    assert.ok(user.lastLogin?.timestamp);
    await findEvent({ type: 'API_LOGIN_TOKEN_CREATED', 'payload.userId': 'code-login' });

    // Single use, for the code and for the link of the same mail
    assertInvalidCredentials(await loginWithLoginCode({ email, code }));
    assertInvalidCredentials(await loginWithLoginCode({ token }));
  });

  test('logs in once with the token of the link', async (t) => {
    enableLoginCode(t);
    const email = await insertUser('code-link');

    const { token, code } = await requestMailedCode(email);
    const { data, headers } = await loginWithLoginCode({ token });
    assert.strictEqual(data.loginWithLoginCode.user._id, 'code-link');
    assert.ok(tokenCookieOf(headers));
    // Without sessionExpiresInSeconds, the default session length
    const lifetime = (new Date(data.loginWithLoginCode.tokenExpires).getTime() - Date.now()) / 1000;
    const expiry = Number(process.env.UNCHAINED_TOKEN_EXPIRY_SECONDS || 3600);
    assert.ok(Math.abs(lifetime - expiry) < 60, `session of ${lifetime}s instead of ${expiry}s`);

    assertInvalidCredentials(await loginWithLoginCode({ token }));
    assertInvalidCredentials(await loginWithLoginCode({ email, code }));
    assertInvalidCredentials(await loginWithLoginCode({ token: 'not-a-token' }));
    assertInvalidCredentials(await loginWithLoginCode({}));
  });

  test('voids the link and the code after maxAttempts wrong codes', async (t) => {
    enableLoginCode(t, { maxAttempts: 3 });
    const email = await insertUser('code-attempts');

    const { token, code } = await requestMailedCode(email);
    const wrong = code === '000000' ? '000001' : '000000';
    for (let i = 0; i < 3; i++) {
      assertInvalidCredentials(await loginWithLoginCode({ email, code: wrong }));
    }

    assertInvalidCredentials(await loginWithLoginCode({ email, code }));
    assertInvalidCredentials(await loginWithLoginCode({ token }));
    assert.strictEqual((await Challenges.findOne({ userId: 'code-attempts' })).attempts, 3);
  });

  test('refuses an expired code', async (t) => {
    enableLoginCode(t);
    const email = await insertUser('code-expired');

    const { token, code } = await requestMailedCode(email);
    await Challenges.updateMany(
      { userId: 'code-expired' },
      { $set: { expires: new Date(Date.now() - 1000) } },
    );

    assertInvalidCredentials(await loginWithLoginCode({ email, code }));
    assertInvalidCredentials(await loginWithLoginCode({ token }));
  });

  test('mails at most maxChallengesPerWindow codes per address', async (t) => {
    enableLoginCode(t, { maxChallengesPerWindow: 2 });
    const email = await insertUser('code-throttled');

    for (let i = 0; i < 3; i++) await requestLoginCode(email);
    const works = await waitForLoginCodeWorks(email, 3);

    assert.deepStrictEqual(
      works.map((work) => work.result.sent),
      [true, true, false],
    );
    assert.strictEqual((await waitForLoginCodeMessages(email, 2)).length, 2);
  });

  test('still mails a code after someone requested a password reset for the address', async (t) => {
    enableLoginCode(t);
    const email = await insertUser('code-after-reset');

    const { data } = await anonymousGraphqlFetch({
      query: /* GraphQL */ `
        mutation ForgotPassword($email: String!) {
          forgotPassword(email: $email) {
            success
          }
        }
      `,
      variables: { email },
    });
    assert.strictEqual(data.forgotPassword.success, true);

    const { code } = await requestMailedCode(email);
    const login = await loginWithLoginCode({ email, code });
    assert.strictEqual(login.data.loginWithLoginCode.user._id, 'code-after-reset');
  });
});
