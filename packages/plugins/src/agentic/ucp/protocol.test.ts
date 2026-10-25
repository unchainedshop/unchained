import assert from 'node:assert';
import { describe, it } from 'node:test';
import { negotiate, parseAgentProfile, parseDictionary, responseCapabilities } from './protocol.ts';

const entry = (version = '2026-08-25') => [{ version }];

describe('UCP protocol', () => {
  it('parses RFC 8941 dictionaries with strings, inner lists, parameters and byte sequences', () => {
    const members = parseDictionary(
      'sig1=("@method" "@path" "content-digest");created=1618884473;keyid="test-key", sig2=:AQID:, flag, n=-12',
    );
    assert.deepEqual(members.get('sig1'), {
      value: ['@method', '@path', 'content-digest'],
      params: [
        ['created', 1618884473],
        ['keyid', 'test-key'],
      ],
    });
    assert.deepEqual(members.get('sig2')!.value, Buffer.from([1, 2, 3]));
    assert.equal(members.get('flag')!.value, true);
    assert.equal(members.get('n')!.value, -12);
    assert.throws(() => parseDictionary('profile="unterminated'), { cause: 'invalid_request' });
  });

  it('reads the platform profile from the UCP-Agent header', () => {
    assert.equal(
      parseAgentProfile('profile="https://agent.example/profiles/a \\"b\\".json", version=1'),
      'https://agent.example/profiles/a "b".json',
    );
    for (const header of [null, '', 'version=1', 'profile="not a url"', 'profile=(']) {
      assert.throws(() => parseAgentProfile(header), { cause: 'invalid_profile_url' });
    }
  });

  it('negotiates the exact version and prunes orphaned extensions to a fixpoint', () => {
    assert.deepEqual(
      [
        ...negotiate({
          'dev.ucp.shopping.checkout': entry(),
          'dev.ucp.shopping.fulfillment': entry(),
          'dev.ucp.shopping.discount': entry('2026-04-08'),
          'dev.ucp.shopping.order': entry(),
          'com.example.unknown': entry(),
        }),
      ],
      ['dev.ucp.shopping.checkout', 'dev.ucp.shopping.fulfillment', 'dev.ucp.shopping.order'],
    );
    assert.deepEqual(
      [
        ...negotiate({
          'dev.ucp.shopping.fulfillment': entry(),
          'dev.ucp.shopping.discount': entry(),
          'dev.ucp.shopping.checkout': entry('2026-04-08'),
        }),
      ],
      [],
    );
    assert.deepEqual([...negotiate(undefined)], []);
  });

  it('answers only the capabilities of the operation', () => {
    const active = negotiate({
      'dev.ucp.shopping.checkout': entry(),
      'dev.ucp.shopping.discount': entry(),
      'dev.ucp.shopping.order': entry(),
    });
    assert.deepEqual(responseCapabilities(active, 'dev.ucp.shopping.checkout'), {
      'dev.ucp.shopping.checkout': entry(),
      'dev.ucp.shopping.discount': entry(),
    });
    assert.deepEqual(responseCapabilities(active, 'dev.ucp.shopping.order'), {
      'dev.ucp.shopping.order': entry(),
    });
  });
});
