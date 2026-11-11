import { describe, it } from 'node:test';
import assert from 'node:assert';
import { resolveAccountActionTemplate } from './resolveAccountActionTemplate.ts';

const createUnchainedAPI = (language: string) => ({
  modules: {
    users: {
      findUserById: async (userId: string) => ({ _id: userId }),
      userLocale: () => new Intl.Locale(language),
      primaryEmail: () => ({ address: 'primary@example.com' }),
    },
  },
});

const loginCodeMessage = {
  template: 'ACCOUNT_ACTION',
  action: 'login-code',
  userId: 'user-id',
  recipientEmail: 'user@example.com',
  token: 'TOKEN',
  code: '482913',
  expiresInMinutes: 15,
};

describe('ACCOUNT_ACTION login-code', () => {
  it('mails the link, the code and the expiry to the requested address', async () => {
    const [mail] = await resolveAccountActionTemplate(loginCodeMessage, createUnchainedAPI('en') as any);

    assert.strictEqual(mail.type, 'EMAIL');
    const { to, subject, text } = mail.input as Record<string, string>;
    assert.strictEqual(to, 'user@example.com');
    assert.match(subject, /Your login link$/);
    assert.match(text, /enter this code: 482 913/);
    assert.match(text, /valid for 15 minutes/);
    assert.match(text, /Log in: .*\/login-code\?token=TOKEN/);
  });

  it('mails in the language of the user and falls back to English', async () => {
    const [german] = await resolveAccountActionTemplate(
      loginCodeMessage,
      createUnchainedAPI('de') as any,
    );
    assert.match((german.input as Record<string, string>).text, /gib diesen Code ein: 482 913/);

    const [italian] = await resolveAccountActionTemplate(
      loginCodeMessage,
      createUnchainedAPI('it') as any,
    );
    assert.match((italian.input as Record<string, string>).subject, /Your login link$/);
  });
});
