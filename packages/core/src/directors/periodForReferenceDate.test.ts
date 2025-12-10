import { describe, it } from 'node:test';
import { periodForReferenceDate } from './EnrollmentAdapter.ts';
import assert from 'node:assert';

describe('periodForReferenceDate', () => {
  it('Should return 1 week interval from When passed a given date', () => {
    assert.deepStrictEqual(periodForReferenceDate(new Date('2022-12-03T17:00:00.000Z')), {
      start: new Date('2022-12-03T17:00:00.000Z'),
      end: new Date('2022-12-10T17:00:00.000Z'),
    });
  });
  it('Should return 2 week interval from When passed 2 as interval', () => {
    assert.deepStrictEqual(periodForReferenceDate(new Date('2022-12-03T17:00:00.000Z'), 2), {
      start: new Date('2022-12-03T17:00:00.000Z'),
      end: new Date('2022-12-17T17:00:00.000Z'),
    });
  });

  it('Should return 2 HOURS when interval is set to HOURS', () => {
    assert.deepStrictEqual(periodForReferenceDate(new Date('2022-12-03T17:00:00.000Z'), 2, 'HOURS'), {
      start: new Date('2022-12-03T17:00:00.000Z'),
      end: new Date('2022-12-03T19:00:00.000Z'),
    });
  });
});
