import { describe, it } from 'node:test';
import assert from 'node:assert';
import { buildFindSelector } from './configureUsersModule.js';

describe('buildFindSelector', () => {
  it('Return the correct filter when no parameter is passed', () => {
    assert.deepStrictEqual(buildFindSelector({}), {
      deleted: null,
      guest: { $ne: true },
    });
  });
  it('Return the correct filter when no parameter is passed queryString and includeGuest: true', () => {
    assert.deepStrictEqual(buildFindSelector({ queryString: 'Hello world', includeGuests: true }), {
      deleted: null,
      $text: { $search: 'Hello world' },
    });
  });

  it('Should include additional user field selector in addition too queryString and includeGuests', () => {
    assert.deepStrictEqual(
      buildFindSelector({
        queryString: 'Hello world',
        includeGuests: false,
        'profile.displayName': 'mikael',
      }),
      {
        'profile.displayName': 'mikael',
        deleted: null,
        guest: { $ne: true },
        $text: { $search: 'Hello world' },
      },
    );
  });
});
