import { periodForReferenceDate } from '../director/EnrollmentAdapter.js';

describe('periodForReferenceDate', () => {
  it('Should return 1 week interval from When passed a given date', () => {
    expect(periodForReferenceDate(new Date('2022-12-03T17:00:00.000Z'))).toEqual({
      start: new Date('2022-12-03T17:00:00.000Z'),
      end: new Date('2022-12-10T17:00:00.000Z'),
    });
  });
  it('Should return 2 week interval from When passed 2 as interval', () => {
    expect(periodForReferenceDate(new Date('2022-12-03T17:00:00.000Z'), 2)).toEqual({
      start: new Date('2022-12-03T17:00:00.000Z'),
      end: new Date('2022-12-17T17:00:00.000Z'),
    });
  });

  it('Should return 2 HOURS when interval is set to HOURS', () => {
    expect(periodForReferenceDate(new Date('2022-12-03T17:00:00.000Z'), 2, 'HOURS')).toEqual({
      start: new Date('2022-12-03T17:00:00.000Z'),
      end: new Date('2022-12-03T19:00:00.000Z'),
    });
  });
});
