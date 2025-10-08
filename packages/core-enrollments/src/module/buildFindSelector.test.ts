import { describe, it } from 'node:test';
import assert from 'node:assert';
import { buildFindSelector } from './configureEnrollmentsModule.js';
import { EnrollmentStatus } from '../db/EnrollmentsCollection.js';

describe('buildFindSelector', () => {
  it('Should correct filter when passed status, userId and queryString', () => {
    assert.deepStrictEqual(
      buildFindSelector({
        queryString: 'Hello World',
        status: [EnrollmentStatus.ACTIVE],
        userId: 'admin-id',
      }),
      {
        deleted: null,
        status: { $in: ['ACTIVE'] },
        userId: 'admin-id',
        $text: { $search: 'Hello World' },
      },
    );
  });

  it('Should correct filter when passed userId and queryString', () => {
    assert.deepStrictEqual(buildFindSelector({ queryString: 'Hello World', userId: 'admin-id' }), {
      deleted: null,
      userId: 'admin-id',
      $text: { $search: 'Hello World' },
    });
  });

  it('Should correct filter when passed queryString', () => {
    assert.deepStrictEqual(buildFindSelector({ queryString: 'Hello World' }), {
      deleted: null,
      $text: { $search: 'Hello World' },
    });
  });

  it('Should correct filter when passed no argument', () => {
    assert.deepStrictEqual(buildFindSelector({}), {
      deleted: null,
    });
  });
});
