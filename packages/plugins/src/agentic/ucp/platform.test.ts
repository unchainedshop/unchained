import assert from 'node:assert';
import { after, before, describe, it } from 'node:test';
import { authorizePlatform, guardedRequest, isSpecialUseAddress } from './platform.ts';

describe('UCP platform access', () => {
  const environment = {
    NODE_ENV: process.env.NODE_ENV,
    UCP_DEV_INSECURE_HOSTS: process.env.UCP_DEV_INSECURE_HOSTS,
  };
  before(() => {
    process.env.NODE_ENV = 'test';
    process.env.UCP_DEV_INSECURE_HOSTS = 'localhost';
  });
  after(() => {
    for (const [key, value] of Object.entries(environment)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it('knows the special-use address ranges', () => {
    for (const address of [
      '0.0.0.0',
      '10.1.2.3',
      '100.64.0.1',
      '127.0.0.1',
      '169.254.169.254',
      '172.16.0.1',
      '192.168.1.1',
      '198.18.0.1',
      '224.0.0.1',
      '255.255.255.255',
      '::1',
      '::ffff:10.0.0.1',
      'fc00::1',
      'fe80::1',
      '2001:db8::1',
      '2002:a00:1::',
    ]) {
      assert.equal(isSpecialUseAddress(address), true, address);
    }
    for (const address of ['8.8.8.8', '185.199.108.153', '2a00:1450:4001:82a::200e']) {
      assert.equal(isSpecialUseAddress(address), false, address);
    }
  });

  it('refuses plain HTTP, credentials and special-use IP literals before connecting', () => {
    assert.throws(() => guardedRequest('http://example.com/profile'), { cause: 'invalid_profile_url' });
    assert.throws(() => guardedRequest('https://user:secret@example.com/profile'), {
      cause: 'invalid_profile_url',
    });
    assert.throws(() => guardedRequest('https://169.254.169.254/latest/meta-data'), {
      cause: 'profile_unreachable',
    });
    assert.throws(() => guardedRequest('https://[fd00::1]/profile'), { cause: 'profile_unreachable' });
  });

  it('checks the resolved address, so DNS rebinding to a private address fails', async () => {
    const lookups: string[] = [];
    await assert.rejects(
      guardedRequest('https://rebinding.example/profile', {
        lookup: ((hostname: string, options: any, callback: any) => {
          lookups.push(hostname);
          callback(null, [
            { address: '93.184.215.14', family: 4 },
            { address: '10.0.0.7', family: 4 },
          ]);
        }) as any,
      }),
      /special-use address/,
    );
    assert.deepEqual(lookups, ['rebinding.example']);
  });

  it('allows loopback over HTTP only for development hosts outside production', async () => {
    await assert.rejects(guardedRequest('http://localhost:9/profile'), { code: 'ECONNREFUSED' });
    process.env.NODE_ENV = 'production';
    assert.throws(() => guardedRequest('http://localhost:9/profile'), { cause: 'invalid_profile_url' });
    process.env.NODE_ENV = 'test';
  });

  it('binds registered platforms to their credentials', () => {
    const options = {
      platforms: [
        { profile: 'https://agent.example/profile', username: 'agent' },
        { profile: 'https://signed.example/profile', requireSignature: true },
      ],
    };
    const agent = { username: 'agent' } as any;
    assert.equal(
      authorizePlatform('https://agent.example/profile', agent, options),
      options.platforms[0],
    );
    assert.equal(
      authorizePlatform('https://signed.example/profile', undefined, options),
      options.platforms[1],
    );
    assert.equal(authorizePlatform('https://anyone.example/profile', undefined, options), undefined);
    assert.throws(() => authorizePlatform('https://agent.example/profile', undefined, options), {
      cause: 'unauthorized',
    });
    assert.throws(
      () => authorizePlatform('https://agent.example/profile', { username: 'someone' } as any, options),
      { cause: 'unauthorized' },
    );
    assert.throws(() => authorizePlatform('https://anyone.example/profile', agent, options), {
      cause: 'unauthorized',
    });
    assert.throws(
      () =>
        authorizePlatform('https://anyone.example/profile', undefined, { ...options, anonymous: false }),
      { cause: 'profile_not_trusted' },
    );
  });
});
