import { describe, it } from 'node:test';
import assert from 'node:assert';
import { parseMailUrls, sanitizeMailUrl, sendMailWithFallback } from './email.ts';

describe('parseMailUrls', () => {
  it('returns an empty list for undefined, empty and whitespace-only values', () => {
    assert.deepStrictEqual(parseMailUrls(undefined), []);
    assert.deepStrictEqual(parseMailUrls(''), []);
    assert.deepStrictEqual(parseMailUrls('   \n  '), []);
  });

  it('keeps a single url unchanged', () => {
    assert.deepStrictEqual(parseMailUrls('smtp://user:pass@primary.example:587'), [
      'smtp://user:pass@primary.example:587',
    ]);
  });

  it('splits multiple urls on any whitespace including newlines', () => {
    assert.deepStrictEqual(
      parseMailUrls(' smtp://a.example:587\n  smtps://b.example:465 smtp://c.example:25 '),
      ['smtp://a.example:587', 'smtps://b.example:465', 'smtp://c.example:25'],
    );
  });

  it('does not split urls containing commas in credentials or query', () => {
    assert.deepStrictEqual(parseMailUrls('smtp://user:p,ss@primary.example:587?name=a,b'), [
      'smtp://user:p,ss@primary.example:587?name=a,b',
    ]);
  });
});

describe('sanitizeMailUrl', () => {
  it('strips credentials and query from the url', () => {
    assert.strictEqual(
      sanitizeMailUrl('smtp://user:secret@primary.example:587?pool=true', 0),
      'smtp://primary.example:587',
    );
  });

  it('falls back to a generic label for unparseable urls', () => {
    assert.strictEqual(sanitizeMailUrl('not a url', 1), 'transport #2');
  });
});

describe('sendMailWithFallback', () => {
  const successTransport = (result) => ({
    sendMail: async () => result,
  });
  const failingTransport = (message, responseCode?: number) => ({
    sendMail: async () => {
      const error = new Error(message) as Error & { responseCode?: number };
      error.responseCode = responseCode;
      throw error;
    },
  });

  it('uses the first transport when it succeeds and never touches the fallback', async () => {
    const calls: string[] = [];
    const { info, transport, failedAttempts } = await sendMailWithFallback(
      ['smtp://primary.example:587', 'smtp://backup.example:587'],
      { to: 'test@example.com' },
      (mailUrl) => {
        calls.push(mailUrl);
        return successTransport({ messageId: '<primary>' });
      },
    );
    assert.deepStrictEqual(calls, ['smtp://primary.example:587']);
    assert.strictEqual(info.messageId, '<primary>');
    assert.strictEqual(transport, 'smtp://primary.example:587');
    assert.deepStrictEqual(failedAttempts, []);
  });

  it('falls back to the next transport and records the failed attempt', async () => {
    const { info, transport, failedAttempts } = await sendMailWithFallback(
      ['smtp://user:secret@primary.example:587', 'smtp://backup.example:587'],
      { to: 'test@example.com' },
      (mailUrl) =>
        mailUrl.includes('primary')
          ? failingTransport('Connection refused', 421)
          : successTransport({ messageId: '<backup>' }),
    );
    assert.strictEqual(info.messageId, '<backup>');
    assert.strictEqual(transport, 'smtp://backup.example:587');
    assert.strictEqual(failedAttempts.length, 1);
    assert.strictEqual(failedAttempts[0].transport, 'smtp://primary.example:587');
    assert.strictEqual(failedAttempts[0].message, 'Connection refused');
    assert.strictEqual(failedAttempts[0].responseCode, 421);
    assert.ok(!failedAttempts[0].transport.includes('secret'));
  });

  it('throws with all attempts when every transport fails', async () => {
    await assert.rejects(
      sendMailWithFallback(
        ['smtp://primary.example:587', 'smtp://backup.example:587'],
        { to: 'test@example.com' },
        () => failingTransport('boom'),
      ),
      (error: Error & { failedAttempts?: any[] }) => {
        assert.match(error.message, /all 2 transport/);
        assert.strictEqual(error.failedAttempts?.length, 2);
        return true;
      },
    );
  });

  it('propagates synchronous transport factory errors as failed attempts', async () => {
    const { transport, failedAttempts } = await sendMailWithFallback(
      ['smtp://broken url with:invalid,port', 'smtp://backup.example:587'],
      { to: 'test@example.com' },
      (mailUrl) => {
        if (mailUrl.startsWith('smtp://broken')) throw new Error('Invalid port in url');
        return successTransport({ messageId: '<backup>' });
      },
    );
    assert.strictEqual(transport, 'smtp://backup.example:587');
    assert.strictEqual(failedAttempts.length, 1);
    assert.strictEqual(failedAttempts[0].message, 'Invalid port in url');
  });
});
