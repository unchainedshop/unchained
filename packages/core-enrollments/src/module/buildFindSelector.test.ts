import { describe, it } from 'node:test';
import assert from 'node:assert';
import { buildFindSelector } from './configureEnrollmentsModule.ts';
import { EnrollmentStatus } from '../db/EnrollmentsCollection.ts';

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

  it('Should filter by SUSPENDED status', () => {
    assert.deepStrictEqual(buildFindSelector({ status: [EnrollmentStatus.SUSPENDED] }), {
      deleted: null,
      status: { $in: ['SUSPENDED'] },
    });
  });

  it('Should filter by multiple statuses including SUSPENDED', () => {
    assert.deepStrictEqual(
      buildFindSelector({
        status: [EnrollmentStatus.ACTIVE, EnrollmentStatus.SUSPENDED, EnrollmentStatus.PAUSED],
      }),
      {
        deleted: null,
        status: { $in: ['ACTIVE', 'SUSPENDED', 'PAUSED'] },
      },
    );
  });
});
