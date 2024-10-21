import { buildFindSelector } from './configureUsersModule.js';

describe('buildFindSelector', () => {
  it('Return the correct filter when no parameter is passed', () => {
    expect(buildFindSelector({})).toEqual({ deleted: null, guest: { $in: [false, null] } });
  });
  it('Return the correct filter when no parameter is passed queryString and includeGuest: true', () => {
    expect(buildFindSelector({ queryString: 'Hello world', includeGuests: true })).toEqual({
      deleted: null,
      $text: { $search: 'Hello world' },
    });
  });

  it('Should include additional user field selector in addition too queryString and includeGuests', () => {
    expect(
      buildFindSelector({
        queryString: 'Hello world',
        includeGuests: false,
        'profile.displayName': 'mikael',
      }),
    ).toEqual({
      'profile.displayName': 'mikael',
      deleted: null,
      guest: { $in: [false, null] },
      $text: { $search: 'Hello world' },
    });
  });
});
