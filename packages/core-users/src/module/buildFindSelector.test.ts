import { describe, it } from 'node:test';
import assert from 'node:assert';
import { buildFindSelector } from './configureUsersModule.ts';

describe('buildFindSelector', () => {
  it('Return the correct filter when no parameter is passed', () => {
    assert.deepStrictEqual(buildFindSelector({}), {
      deleted: null,
      guest: { $ne: true },
    });
  });
  it('Return the correct filter when queryString and includeGuest: true is passed', () => {
    assert.deepStrictEqual(buildFindSelector({ queryString: 'Hello world', includeGuests: true }), {
      deleted: null,
      $text: { $search: 'Hello world' },
    });
  });

  it('Should include username filter in addition to queryString and includeGuests', () => {
    const result = buildFindSelector({
      queryString: 'Hello world',
      includeGuests: false,
      username: 'mikael',
    });
    assert.deepStrictEqual(result.deleted, null);
    assert.deepStrictEqual(result.guest, { $ne: true });
    assert.deepStrictEqual(result.$text, { $search: 'Hello world' });
    // username is transformed to a regex for case-insensitive matching
    assert.ok(result.username);
  });

  it('Should include web3Verified filter when passed', () => {
    assert.deepStrictEqual(buildFindSelector({ web3Verified: true }), {
      deleted: null,
      guest: { $ne: true },
      'services.web3.verified': true,
    });
  });
});
