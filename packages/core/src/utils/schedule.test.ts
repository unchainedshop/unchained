import { describe, it } from 'node:test';
import assert from 'node:assert';
import schedule, { type ScheduleData } from './schedule.ts';

describe('schedule.parse.cron', () => {
  it('should parse "* * * * *" (every minute)', () => {
    const result = schedule.parse.cron('* * * * *');
    assert.deepStrictEqual(result, {
      schedules: [{ s: [0], m: undefined, h: undefined, D: undefined, M: undefined, d: undefined }],
    });
  });

  it('should parse "0 15 * * *" (every day at 15:00)', () => {
    const result = schedule.parse.cron('0 15 * * *');
    assert.deepStrictEqual(result, {
      schedules: [{ s: [0], m: [0], h: [15], D: undefined, M: undefined, d: undefined }],
    });
  });

  it('should parse "0 3 * * *" (every day at 03:00)', () => {
    const result = schedule.parse.cron('0 3 * * *');
    assert.deepStrictEqual(result, {
      schedules: [{ s: [0], m: [0], h: [3], D: undefined, M: undefined, d: undefined }],
    });
  });

  it('should parse "30 4 1 * *" (4:30 AM on the 1st of every month)', () => {
    const result = schedule.parse.cron('30 4 1 * *');
    assert.deepStrictEqual(result, {
      schedules: [{ s: [0], m: [30], h: [4], D: [1], M: undefined, d: undefined }],
    });
  });

  it('should parse ranges like "1-5"', () => {
    const result = schedule.parse.cron('0 9-17 * * *');
    assert.deepStrictEqual(result.schedules[0].h, [9, 10, 11, 12, 13, 14, 15, 16, 17]);
  });

  it('should parse steps like "*/5"', () => {
    const result = schedule.parse.cron('*/15 * * * *');
    assert.deepStrictEqual(result.schedules[0].m, [0, 15, 30, 45]);
  });

  it('should parse comma-separated values', () => {
    const result = schedule.parse.cron('0 9,12,18 * * *');
    assert.deepStrictEqual(result.schedules[0].h, [9, 12, 18]);
  });

  it('should throw for invalid cron expression', () => {
    assert.throws(() => {
      schedule.parse.cron('* * *');
    }, /Invalid cron expression/);
  });
});

describe('schedule.parse.text', () => {
  it('should parse "every 2 seconds"', () => {
    const result = schedule.parse.text('every 2 seconds');
    assert.deepStrictEqual(result, {
      schedules: [
        {
          s: [
            0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46,
            48, 50, 52, 54, 56, 58,
          ],
        },
      ],
    });
  });

  it('should parse "every 30 seconds"', () => {
    const result = schedule.parse.text('every 30 seconds');
    assert.deepStrictEqual(result, {
      schedules: [{ s: [0, 30] }],
    });
  });

  it('should parse "every 59 minutes"', () => {
    const result = schedule.parse.text('every 59 minutes');
    assert.deepStrictEqual(result, {
      schedules: [{ s: [0], m: [0, 59] }],
    });
  });

  it('should parse "every 1 hour"', () => {
    const result = schedule.parse.text('every 1 hour');
    assert.deepStrictEqual(result, {
      schedules: [
        {
          s: [0],
          m: [0],
          h: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23],
        },
      ],
    });
  });

  it('should parse "every 6 hours"', () => {
    const result = schedule.parse.text('every 6 hours');
    assert.deepStrictEqual(result, {
      schedules: [{ s: [0], m: [0], h: [0, 6, 12, 18] }],
    });
  });

  it('should be case insensitive', () => {
    const result = schedule.parse.text('EVERY 5 MINUTES');
    assert.deepStrictEqual(result.schedules[0].m, [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]);
  });

  it('should throw for invalid text schedule', () => {
    assert.throws(() => {
      schedule.parse.text('invalid schedule');
    }, /Invalid schedule text/);
  });
});

describe('schedule.schedule().next()', () => {
  it('should return next occurrence for "every minute" cron', () => {
    const scheduleData = schedule.parse.cron('* * * * *');
    const referenceDate = new Date('2024-01-15T10:30:45.000Z');
    const nextDate = schedule.schedule(scheduleData).next(1, referenceDate) as Date;

    // Should be the next minute at second 0
    assert.strictEqual(nextDate.getUTCMinutes(), 31);
    assert.strictEqual(nextDate.getUTCSeconds(), 0);
  });

  it('should return next 2 occurrences', () => {
    const scheduleData = schedule.parse.cron('* * * * *');
    const referenceDate = new Date('2024-01-15T10:30:00.000Z');
    const nextDates = schedule.schedule(scheduleData).next(2, referenceDate) as Date[];

    assert.strictEqual(nextDates.length, 2);
    assert.strictEqual(nextDates[0].getUTCMinutes(), 31);
    assert.strictEqual(nextDates[1].getUTCMinutes(), 32);
  });

  it('should return next occurrence for "every 2 seconds" text', () => {
    const scheduleData = schedule.parse.text('every 2 seconds');
    const referenceDate = new Date('2024-01-15T10:30:01.000Z');
    const nextDate = schedule.schedule(scheduleData).next(1, referenceDate) as Date;

    // Should be second 2 (next even second after 1)
    assert.strictEqual(nextDate.getUTCSeconds(), 2);
  });

  it('should return next occurrence for specific hour cron', () => {
    const scheduleData = schedule.parse.cron('0 15 * * *');
    // Use a reference date where local hour is 10
    const referenceDate = new Date();
    referenceDate.setHours(10, 0, 0, 0);
    const nextDate = schedule.schedule(scheduleData).next(1, referenceDate) as Date;

    // Should be 15:00 local time on the same day
    assert.strictEqual(nextDate.getHours(), 15);
    assert.strictEqual(nextDate.getMinutes(), 0);
    assert.strictEqual(nextDate.getSeconds(), 0);
  });

  it('should return next day if time has passed', () => {
    const scheduleData = schedule.parse.cron('0 15 * * *');
    // Use a reference date where local hour is 16 (after 15:00)
    const referenceDate = new Date();
    referenceDate.setHours(16, 0, 0, 0);
    const nextDate = schedule.schedule(scheduleData).next(1, referenceDate) as Date;

    // Should be 15:00 local time on the next day
    assert.strictEqual(nextDate.getHours(), 15);
    // Calculate expected next day accounting for month boundaries
    const expectedNextDay = new Date(referenceDate);
    expectedNextDay.setDate(expectedNextDay.getDate() + 1);
    assert.strictEqual(nextDate.getDate(), expectedNextDay.getDate());
  });

  it('should work with scheduleToInterval pattern', () => {
    // This tests the pattern used in IntervalWorker.ts
    const scheduleData = schedule.parse.text('every 30 seconds');
    const referenceDate = new Date(1000); // Reference date used in IntervalWorker
    const nextDates = schedule.schedule(scheduleData).next(2, referenceDate) as Date[];

    assert.strictEqual(nextDates.length, 2);
    // The difference between consecutive dates should be 30 seconds
    const diff = nextDates[1].getTime() - nextDates[0].getTime();
    assert.strictEqual(diff, 30000);
  });
});

describe('scheduleToInterval equivalent', () => {
  // Replicating the scheduleToInterval function from IntervalWorker.ts
  const scheduleToInterval = (scheduleData: ScheduleData) => {
    const referenceDate = new Date(1000);
    const nextDates = schedule.schedule(scheduleData).next(2, referenceDate) as Date[];

    if (!nextDates || nextDates.length < 2) {
      throw new Error('Schedule must produce at least 2 consecutive dates');
    }

    const [one, two] = nextDates;
    const diff = new Date(two).getTime() - new Date(one).getTime();
    return Math.min(1000 * 60 * 60, diff); // at least once every hour!
  };

  it('should calculate 2 second interval', () => {
    const scheduleData = schedule.parse.text('every 2 seconds');
    const interval = scheduleToInterval(scheduleData);
    assert.strictEqual(interval, 2000);
  });

  it('should calculate 30 second interval', () => {
    const scheduleData = schedule.parse.text('every 30 seconds');
    const interval = scheduleToInterval(scheduleData);
    assert.strictEqual(interval, 30000);
  });

  it('should calculate 1 minute interval from cron', () => {
    const scheduleData = schedule.parse.cron('* * * * *');
    const interval = scheduleToInterval(scheduleData);
    assert.strictEqual(interval, 60000);
  });

  it('should cap interval at 1 hour', () => {
    // A cron that runs once per day would exceed 1 hour, so it should be capped
    const scheduleData = schedule.parse.cron('0 15 * * *');
    const interval = scheduleToInterval(scheduleData);
    assert.strictEqual(interval, 1000 * 60 * 60); // 1 hour max
  });
});
