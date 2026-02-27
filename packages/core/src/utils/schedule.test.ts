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
    assert.strictEqual(nextDate.getDate(), referenceDate.getDate() + 1);
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

// ============================================================================
// Production caller patterns
// ============================================================================

describe('BaseWorker.autorescheduleTypes pattern', () => {
  // Replicates the exact call pattern from BaseWorker.ts lines 73-75:
  //   fixedSchedule.schedules[0].s = [0];
  //   const nextDate = schedule.schedule(fixedSchedule).next(1, referenceDate) as Date;

  it('should find next for "0 3 * * *" (error-notifications) when reference is after 03:00', () => {
    const sched = schedule.parse.cron('0 3 * * *');
    sched.schedules[0].s = [0]; // BaseWorker override
    const ref = new Date(2024, 5, 15, 3, 1, 0); // June 15 at 03:01
    const next = schedule.schedule(sched).next(1, ref) as Date;

    assert.strictEqual(next.getHours(), 3);
    assert.strictEqual(next.getMinutes(), 0);
    assert.strictEqual(next.getSeconds(), 0);
    assert.strictEqual(next.getDate(), 16); // next day
  });

  it('should find next for "0 3 * * *" when reference is before 03:00', () => {
    const sched = schedule.parse.cron('0 3 * * *');
    sched.schedules[0].s = [0];
    const ref = new Date(2024, 5, 15, 1, 30, 0); // June 15 at 01:30
    const next = schedule.schedule(sched).next(1, ref) as Date;

    assert.strictEqual(next.getHours(), 3);
    assert.strictEqual(next.getMinutes(), 0);
    assert.strictEqual(next.getDate(), 15); // same day
  });

  it('should find next for "0 15 * * *" (update-ecb-rates) from current-ish time', () => {
    const sched = schedule.parse.cron('0 15 * * *');
    sched.schedules[0].s = [0];
    const ref = new Date(2024, 0, 10, 15, 30, 0); // Jan 10 at 15:30
    const next = schedule.schedule(sched).next(1, ref) as Date;

    assert.strictEqual(next.getHours(), 15);
    assert.strictEqual(next.getMinutes(), 0);
    assert.strictEqual(next.getDate(), 11); // next day
  });

  it('should find next for "* * * * *" (every-minute workers) with s=[0] override', () => {
    const sched = schedule.parse.cron('* * * * *');
    sched.schedules[0].s = [0]; // already [0], but BaseWorker sets it anyway
    const ref = new Date(2024, 0, 10, 12, 30, 30);
    const next = schedule.schedule(sched).next(1, ref) as Date;

    assert.strictEqual(next.getMinutes(), 31);
    assert.strictEqual(next.getSeconds(), 0);
  });
});

describe('IntervalWorker.scheduleToInterval pattern', () => {
  const scheduleToInterval = (scheduleData: ScheduleData) => {
    const referenceDate = new Date(1000);
    const nextDates = schedule.schedule(scheduleData).next(2, referenceDate) as Date[];
    if (!nextDates || nextDates.length < 2) {
      throw new Error('Schedule must produce at least 2 consecutive dates');
    }
    const [one, two] = nextDates;
    return Math.min(1000 * 60 * 60, new Date(two).getTime() - new Date(one).getTime());
  };

  it('production dev schedule: every 2 seconds', () => {
    assert.strictEqual(scheduleToInterval(schedule.parse.text('every 2 seconds')), 2000);
  });

  it('production schedule: every 30 seconds', () => {
    assert.strictEqual(scheduleToInterval(schedule.parse.text('every 30 seconds')), 30000);
  });

  it('every 5 minutes', () => {
    assert.strictEqual(scheduleToInterval(schedule.parse.text('every 5 minutes')), 300000);
  });

  it('every 6 hours (capped at 1 hour)', () => {
    assert.strictEqual(scheduleToInterval(schedule.parse.text('every 6 hours')), 3600000);
  });
});

// ============================================================================
// Time-field overflow / carry-over
// ============================================================================

describe('second overflow', () => {
  it('should roll from second 59 to next minute', () => {
    const sched = schedule.parse.text('every 30 seconds'); // s=[0,30]
    const ref = new Date(2024, 0, 15, 10, 30, 45); // second 45
    const next = schedule.schedule(sched).next(1, ref) as Date;

    assert.strictEqual(next.getMinutes(), 31);
    assert.strictEqual(next.getSeconds(), 0);
  });

  it('should produce correct sequence across second/minute boundary', () => {
    const sched = schedule.parse.text('every 30 seconds'); // s=[0,30]
    const ref = new Date(2024, 0, 15, 10, 30, 0);
    const dates = schedule.schedule(sched).next(4, ref) as Date[];

    assert.strictEqual(dates.length, 4);
    assert.strictEqual(dates[0].getMinutes(), 30);
    assert.strictEqual(dates[0].getSeconds(), 30);
    assert.strictEqual(dates[1].getMinutes(), 31);
    assert.strictEqual(dates[1].getSeconds(), 0);
    assert.strictEqual(dates[2].getMinutes(), 31);
    assert.strictEqual(dates[2].getSeconds(), 30);
    assert.strictEqual(dates[3].getMinutes(), 32);
    assert.strictEqual(dates[3].getSeconds(), 0);
  });
});

describe('minute overflow', () => {
  it('should roll from minute 59 to next hour', () => {
    // every minute (s=[0], m=undefined) → next after xx:59:30 should be next hour :00:00
    const sched = schedule.parse.cron('* * * * *');
    const ref = new Date(2024, 0, 15, 10, 59, 30);
    const next = schedule.schedule(sched).next(1, ref) as Date;

    assert.strictEqual(next.getHours(), 11);
    assert.strictEqual(next.getMinutes(), 0);
    assert.strictEqual(next.getSeconds(), 0);
  });

  it('should advance across minute boundary for constrained minutes', () => {
    const sched = schedule.parse.cron('*/15 * * * *'); // m=[0,15,30,45], s=[0]
    const ref = new Date(2024, 0, 15, 10, 45, 0);
    const next = schedule.schedule(sched).next(1, ref) as Date;

    assert.strictEqual(next.getHours(), 11);
    assert.strictEqual(next.getMinutes(), 0);
    assert.strictEqual(next.getSeconds(), 0);
  });
});

describe('hour overflow', () => {
  it('should roll from hour 23 to next day', () => {
    const sched = schedule.parse.cron('0 9,12,18 * * *'); // h=[9,12,18]
    const ref = new Date(2024, 0, 15, 18, 0, 0);
    const next = schedule.schedule(sched).next(1, ref) as Date;

    assert.strictEqual(next.getDate(), 16);
    assert.strictEqual(next.getHours(), 9);
    assert.strictEqual(next.getMinutes(), 0);
  });

  it('should roll midnight correctly with unconstrained hours', () => {
    // every minute at 23:59:xx → next is 00:00:00 next day
    const sched = schedule.parse.cron('* * * * *');
    const ref = new Date(2024, 0, 15, 23, 59, 30);
    const next = schedule.schedule(sched).next(1, ref) as Date;

    assert.strictEqual(next.getDate(), 16);
    assert.strictEqual(next.getHours(), 0);
    assert.strictEqual(next.getMinutes(), 0);
    assert.strictEqual(next.getSeconds(), 0);
  });
});

// ============================================================================
// Calendar boundary edge cases
// ============================================================================

describe('day-of-month overflow', () => {
  it('should roll from Jan 31 to Feb 1', () => {
    const sched = schedule.parse.cron('0 3 * * *');
    const ref = new Date(2024, 0, 31, 3, 0, 0); // Jan 31 at 03:00
    const next = schedule.schedule(sched).next(1, ref) as Date;

    assert.strictEqual(next.getMonth(), 1); // February
    assert.strictEqual(next.getDate(), 1);
    assert.strictEqual(next.getHours(), 3);
  });

  it('should roll from Feb 28 to Mar 1 in non-leap year', () => {
    const sched = schedule.parse.cron('0 3 * * *');
    const ref = new Date(2023, 1, 28, 3, 0, 0); // Feb 28, 2023 at 03:00
    const next = schedule.schedule(sched).next(1, ref) as Date;

    assert.strictEqual(next.getMonth(), 2); // March
    assert.strictEqual(next.getDate(), 1);
    assert.strictEqual(next.getHours(), 3);
  });

  it('should roll from Feb 28 to Feb 29 in leap year', () => {
    const sched = schedule.parse.cron('0 3 * * *');
    const ref = new Date(2024, 1, 28, 3, 0, 0); // Feb 28, 2024 (leap year) at 03:00
    const next = schedule.schedule(sched).next(1, ref) as Date;

    assert.strictEqual(next.getMonth(), 1); // still February
    assert.strictEqual(next.getDate(), 29);
    assert.strictEqual(next.getHours(), 3);
  });

  it('should roll from Feb 29 to Mar 1 in leap year', () => {
    const sched = schedule.parse.cron('0 3 * * *');
    const ref = new Date(2024, 1, 29, 3, 0, 0); // Feb 29, 2024 at 03:00
    const next = schedule.schedule(sched).next(1, ref) as Date;

    assert.strictEqual(next.getMonth(), 2); // March
    assert.strictEqual(next.getDate(), 1);
    assert.strictEqual(next.getHours(), 3);
  });

  it('should skip months that lack a specific day-of-month', () => {
    // "at 03:00 on the 31st" should skip Feb, Apr, Jun, Sep, Nov
    const sched = schedule.parse.cron('0 3 31 * *');
    const ref = new Date(2024, 0, 31, 3, 0, 0); // Jan 31 at 03:00
    const next = schedule.schedule(sched).next(1, ref) as Date;

    // Next month with 31 days after January is March
    assert.strictEqual(next.getMonth(), 2); // March
    assert.strictEqual(next.getDate(), 31);
    assert.strictEqual(next.getHours(), 3);
  });

  it('should produce correct sequence of 31st-of-month occurrences', () => {
    const sched = schedule.parse.cron('0 0 31 * *');
    const ref = new Date(2024, 0, 1, 0, 0, 0); // Jan 1
    const dates = schedule.schedule(sched).next(7, ref) as Date[];

    // Months with 31 days in 2024: Jan, Mar, May, Jul, Aug, Oct, Dec
    const expectedMonths = [0, 2, 4, 6, 7, 9, 11]; // 0-indexed
    assert.strictEqual(dates.length, 7);
    for (let i = 0; i < 7; i++) {
      assert.strictEqual(dates[i].getMonth(), expectedMonths[i], `occurrence ${i}`);
      assert.strictEqual(dates[i].getDate(), 31);
    }
  });
});

describe('month overflow / year boundary', () => {
  it('should roll from Dec 31 to Jan 1 next year', () => {
    const sched = schedule.parse.cron('0 3 * * *');
    const ref = new Date(2024, 11, 31, 3, 0, 0); // Dec 31 at 03:00
    const next = schedule.schedule(sched).next(1, ref) as Date;

    assert.strictEqual(next.getFullYear(), 2025);
    assert.strictEqual(next.getMonth(), 0); // January
    assert.strictEqual(next.getDate(), 1);
    assert.strictEqual(next.getHours(), 3);
  });

  it('should advance year for month-constrained schedule', () => {
    // "at 03:00 on the 1st of January" → once per year
    const sched = schedule.parse.cron('0 3 1 1 *');
    const ref = new Date(2024, 0, 1, 3, 0, 0); // Jan 1, 2024 at 03:00
    const next = schedule.schedule(sched).next(1, ref) as Date;

    assert.strictEqual(next.getFullYear(), 2025);
    assert.strictEqual(next.getMonth(), 0);
    assert.strictEqual(next.getDate(), 1);
  });

  it('should find next occurrence across year for specific months', () => {
    // "at 00:00 on the 1st of March and September"
    const sched: ScheduleData = {
      schedules: [{ s: [0], m: [0], h: [0], D: [1], M: [3, 9] }],
    };
    const ref = new Date(2024, 8, 1, 0, 0, 0); // Sep 1 at 00:00
    const next = schedule.schedule(sched).next(1, ref) as Date;

    assert.strictEqual(next.getFullYear(), 2025);
    assert.strictEqual(next.getMonth(), 2); // March (0-indexed)
    assert.strictEqual(next.getDate(), 1);
  });
});

// ============================================================================
// Day-of-week constraints
// ============================================================================

describe('day-of-week scheduling', () => {
  it('should find next Monday (cron day 1)', () => {
    // "0 9 * * 1" = every Monday at 09:00
    const sched = schedule.parse.cron('0 9 * * 1');
    // 2024-01-15 is a Monday
    const ref = new Date(2024, 0, 15, 9, 0, 0); // Monday at 09:00
    const next = schedule.schedule(sched).next(1, ref) as Date;

    assert.strictEqual(next.getDate(), 22); // next Monday
    assert.strictEqual(next.getHours(), 9);
    assert.strictEqual(next.getDay(), 1); // Monday
  });

  it('should find next Friday from Wednesday', () => {
    // "0 17 * * 5" = every Friday at 17:00
    const sched = schedule.parse.cron('0 17 * * 5');
    // 2024-01-17 is a Wednesday
    const ref = new Date(2024, 0, 17, 12, 0, 0);
    const next = schedule.schedule(sched).next(1, ref) as Date;

    assert.strictEqual(next.getDate(), 19); // Friday
    assert.strictEqual(next.getDay(), 5);
    assert.strictEqual(next.getHours(), 17);
  });

  it('should wrap week when day-of-week is earlier in the week', () => {
    // "0 9 * * 1" = every Monday at 09:00, reference is Friday
    const sched = schedule.parse.cron('0 9 * * 1');
    // 2024-01-19 is a Friday
    const ref = new Date(2024, 0, 19, 12, 0, 0);
    const next = schedule.schedule(sched).next(1, ref) as Date;

    assert.strictEqual(next.getDate(), 22); // next Monday
    assert.strictEqual(next.getDay(), 1);
  });

  it('should find multiple consecutive Mondays', () => {
    const sched = schedule.parse.cron('0 9 * * 1');
    const ref = new Date(2024, 0, 14, 12, 0, 0); // Sunday
    const dates = schedule.schedule(sched).next(4, ref) as Date[];

    assert.strictEqual(dates.length, 4);
    for (const d of dates) {
      assert.strictEqual(d.getDay(), 1, `${d.toISOString()} should be Monday`);
      assert.strictEqual(d.getHours(), 9);
    }
    // Mondays: Jan 15, 22, 29, Feb 5
    assert.strictEqual(dates[0].getDate(), 15);
    assert.strictEqual(dates[1].getDate(), 22);
    assert.strictEqual(dates[2].getDate(), 29);
    assert.strictEqual(dates[3].getMonth(), 1);
    assert.strictEqual(dates[3].getDate(), 5);
  });

  it('should handle weekday schedule (Mon-Fri)', () => {
    // "0 9 * * 1-5" = weekdays at 09:00
    const sched = schedule.parse.cron('0 9 * * 1-5');
    // 2024-01-19 is a Friday
    const ref = new Date(2024, 0, 19, 9, 0, 0); // Friday at 09:00
    const dates = schedule.schedule(sched).next(3, ref) as Date[];

    // Next weekdays: Mon Jan 22, Tue Jan 23, Wed Jan 24
    assert.strictEqual(dates[0].getDate(), 22);
    assert.strictEqual(dates[0].getDay(), 1); // Monday
    assert.strictEqual(dates[1].getDate(), 23);
    assert.strictEqual(dates[1].getDay(), 2); // Tuesday
    assert.strictEqual(dates[2].getDate(), 24);
    assert.strictEqual(dates[2].getDay(), 3); // Wednesday
  });

  it('should handle day-of-week wrapping across month boundary', () => {
    // "0 9 * * 1" = Mondays at 09:00
    const sched = schedule.parse.cron('0 9 * * 1');
    // 2024-01-29 is a Monday, next Monday is Feb 5
    const ref = new Date(2024, 0, 29, 9, 0, 0);
    const next = schedule.schedule(sched).next(1, ref) as Date;

    assert.strictEqual(next.getMonth(), 1); // February
    assert.strictEqual(next.getDate(), 5);
    assert.strictEqual(next.getDay(), 1);
  });
});

// ============================================================================
// Combined day-of-month + day-of-week constraints
// ============================================================================

describe('combined day-of-month and day-of-week', () => {
  it('should require both day-of-month AND day-of-week to match', () => {
    // "0 9 15 * 1" = 15th of month AND a Monday at 09:00
    const sched: ScheduleData = {
      schedules: [{ s: [0], m: [0], h: [9], D: [15], d: [1] }],
    };
    // Jan 15 2024 is a Monday — should be found
    const ref = new Date(2024, 0, 1, 0, 0, 0);
    const next = schedule.schedule(sched).next(1, ref) as Date;

    assert.strictEqual(next.getMonth(), 0); // January
    assert.strictEqual(next.getDate(), 15);
    assert.strictEqual(next.getDay(), 1); // Monday
    assert.strictEqual(next.getHours(), 9);
  });

  it('should skip months where 15th is not a Monday', () => {
    const sched: ScheduleData = {
      schedules: [{ s: [0], m: [0], h: [9], D: [15], d: [1] }],
    };
    // After Jan 15 2024 (Monday), next 15th that's a Monday: Apr 15 2024
    const ref = new Date(2024, 0, 15, 9, 0, 0);
    const next = schedule.schedule(sched).next(1, ref) as Date;

    assert.strictEqual(next.getMonth(), 3); // April
    assert.strictEqual(next.getDate(), 15);
    assert.strictEqual(next.getDay(), 1);
  });
});

// ============================================================================
// Month constraints
// ============================================================================

describe('month-constrained schedules', () => {
  it('should only fire in specified months', () => {
    // "at 00:00 on the 1st of Jan, Apr, Jul, Oct" (quarterly)
    const sched: ScheduleData = {
      schedules: [{ s: [0], m: [0], h: [0], D: [1], M: [1, 4, 7, 10] }],
    };
    const ref = new Date(2024, 0, 1, 0, 0, 0); // Jan 1 at midnight
    const dates = schedule.schedule(sched).next(4, ref) as Date[];

    assert.strictEqual(dates[0].getMonth(), 3); // Apr (next after Jan 1)
    assert.strictEqual(dates[1].getMonth(), 6); // Jul
    assert.strictEqual(dates[2].getMonth(), 9); // Oct
    assert.strictEqual(dates[3].getMonth(), 0); // Jan next year
    assert.strictEqual(dates[3].getFullYear(), 2025);
  });

  it('should advance to next valid month when current month is not in schedule', () => {
    const sched: ScheduleData = {
      schedules: [{ s: [0], m: [0], h: [0], D: [1], M: [6, 12] }],
    };
    const ref = new Date(2024, 2, 15, 0, 0, 0); // March 15
    const next = schedule.schedule(sched).next(1, ref) as Date;

    assert.strictEqual(next.getMonth(), 5); // June (0-indexed)
    assert.strictEqual(next.getDate(), 1);
  });
});

// ============================================================================
// Exact timing edge cases
// ============================================================================

describe('exact boundary timing', () => {
  it('should not return the exact reference second (always advances)', () => {
    const sched = schedule.parse.text('every 2 seconds'); // s=[0,2,4,...,58]
    const ref = new Date(2024, 0, 15, 10, 30, 4); // second 4 (a match)
    const next = schedule.schedule(sched).next(1, ref) as Date;

    // Must return second 6, not second 4
    assert.strictEqual(next.getSeconds(), 6);
  });

  it('should return next second when reference is one second before a match', () => {
    const sched = schedule.parse.text('every 30 seconds'); // s=[0,30]
    const ref = new Date(2024, 0, 15, 10, 30, 29);
    const next = schedule.schedule(sched).next(1, ref) as Date;

    assert.strictEqual(next.getSeconds(), 30);
    assert.strictEqual(next.getMinutes(), 30);
  });

  it('should handle reference at exact second 0 of a minute match', () => {
    const sched = schedule.parse.cron('30 * * * *'); // minute 30
    const ref = new Date(2024, 0, 15, 10, 30, 0); // exactly on match
    const next = schedule.schedule(sched).next(1, ref) as Date;

    // Should go to next hour's :30:00
    assert.strictEqual(next.getHours(), 11);
    assert.strictEqual(next.getMinutes(), 30);
    assert.strictEqual(next.getSeconds(), 0);
  });

  it('should handle millisecond-precision reference dates', () => {
    const sched = schedule.parse.text('every 2 seconds');
    const ref = new Date(2024, 0, 15, 10, 30, 3, 999); // 3.999 seconds
    const next = schedule.schedule(sched).next(1, ref) as Date;

    // After truncating ms and adding 1s → second 4, which matches
    assert.strictEqual(next.getSeconds(), 4);
  });
});

// ============================================================================
// Multiple occurrences & ordering
// ============================================================================

describe('multiple occurrences', () => {
  it('should return strictly increasing dates', () => {
    const sched = schedule.parse.cron('*/15 * * * *'); // every 15 min
    const ref = new Date(2024, 0, 15, 10, 0, 0);
    const dates = schedule.schedule(sched).next(10, ref) as Date[];

    assert.strictEqual(dates.length, 10);
    for (let i = 1; i < dates.length; i++) {
      assert.ok(
        dates[i].getTime() > dates[i - 1].getTime(),
        `dates[${i}] (${dates[i].toISOString()}) should be after dates[${i - 1}] (${dates[i - 1].toISOString()})`,
      );
    }
  });

  it('should return consistent intervals for "every 2 seconds"', () => {
    const sched = schedule.parse.text('every 2 seconds');
    const ref = new Date(2024, 0, 15, 10, 30, 0);
    const dates = schedule.schedule(sched).next(30, ref) as Date[];

    assert.strictEqual(dates.length, 30);
    for (let i = 1; i < dates.length; i++) {
      const diff = dates[i].getTime() - dates[i - 1].getTime();
      assert.strictEqual(diff, 2000, `gap between occurrence ${i - 1} and ${i}`);
    }
  });

  it('should return consistent intervals for "every 5 minutes"', () => {
    const sched = schedule.parse.text('every 5 minutes');
    const ref = new Date(2024, 0, 15, 0, 0, 0);
    const dates = schedule.schedule(sched).next(12, ref) as Date[];

    assert.strictEqual(dates.length, 12);
    for (let i = 1; i < dates.length; i++) {
      const diff = dates[i].getTime() - dates[i - 1].getTime();
      assert.strictEqual(diff, 300000, `gap between occurrence ${i - 1} and ${i}`);
    }
  });

  it('should produce 365 daily occurrences correctly', () => {
    const sched = schedule.parse.cron('0 3 * * *'); // daily at 03:00
    const ref = new Date(2024, 0, 1, 0, 0, 0); // Jan 1, 2024 (leap year)
    const dates = schedule.schedule(sched).next(366, ref) as Date[];

    assert.strictEqual(dates.length, 366);

    // First should be Jan 1 at 03:00
    assert.strictEqual(dates[0].getMonth(), 0);
    assert.strictEqual(dates[0].getDate(), 1);
    assert.strictEqual(dates[0].getHours(), 3);

    // Should include Feb 29 (2024 is leap year)
    const feb29 = dates.find((d) => d.getMonth() === 1 && d.getDate() === 29);
    assert.ok(feb29, 'should include Feb 29 in leap year');

    // Last should be Dec 31 at 03:00
    assert.strictEqual(dates[365].getMonth(), 11);
    assert.strictEqual(dates[365].getDate(), 31);

    // All should be at 03:00
    for (const d of dates) {
      assert.strictEqual(d.getHours(), 3);
      assert.strictEqual(d.getMinutes(), 0);
      assert.strictEqual(d.getSeconds(), 0);
    }

    // All should be strictly increasing
    for (let i = 1; i < dates.length; i++) {
      assert.ok(dates[i].getTime() > dates[i - 1].getTime());
    }
  });
});

// ============================================================================
// Complex / combined field schedules
// ============================================================================

describe('complex schedules', () => {
  it('should handle "at 9:00 and 17:00 on weekdays"', () => {
    // "0 9,17 * * 1-5"
    const sched = schedule.parse.cron('0 9,17 * * 1-5');
    // 2024-01-15 is a Monday
    const ref = new Date(2024, 0, 15, 0, 0, 0);
    const dates = schedule.schedule(sched).next(4, ref) as Date[];

    assert.strictEqual(dates[0].getHours(), 9);
    assert.strictEqual(dates[0].getDate(), 15);
    assert.strictEqual(dates[1].getHours(), 17);
    assert.strictEqual(dates[1].getDate(), 15);
    assert.strictEqual(dates[2].getHours(), 9);
    assert.strictEqual(dates[2].getDate(), 16); // Tuesday
    assert.strictEqual(dates[3].getHours(), 17);
    assert.strictEqual(dates[3].getDate(), 16);
  });

  it('should handle every 15 minutes during business hours', () => {
    // "*/15 9-17 * * *"
    const sched = schedule.parse.cron('*/15 9-17 * * *');
    const ref = new Date(2024, 0, 15, 17, 45, 0); // 17:45
    const next = schedule.schedule(sched).next(1, ref) as Date;

    // Next match: 09:00 next day
    assert.strictEqual(next.getDate(), 16);
    assert.strictEqual(next.getHours(), 9);
    assert.strictEqual(next.getMinutes(), 0);
  });

  it('should handle "first of every quarter at midnight"', () => {
    const sched: ScheduleData = {
      schedules: [{ s: [0], m: [0], h: [0], D: [1], M: [1, 4, 7, 10] }],
    };
    const ref = new Date(2024, 6, 1, 0, 0, 0); // Jul 1 midnight
    const dates = schedule.schedule(sched).next(3, ref) as Date[];

    assert.strictEqual(dates[0].getMonth(), 9); // October
    assert.strictEqual(dates[0].getFullYear(), 2024);
    assert.strictEqual(dates[1].getMonth(), 0); // January
    assert.strictEqual(dates[1].getFullYear(), 2025);
    assert.strictEqual(dates[2].getMonth(), 3); // April
    assert.strictEqual(dates[2].getFullYear(), 2025);
  });

  it('should handle schedule with all fields constrained', () => {
    // "30 14 1 6 *" = June 1 at 14:30
    const sched = schedule.parse.cron('30 14 1 6 *');
    const ref = new Date(2024, 5, 1, 14, 30, 0); // exactly on match
    const next = schedule.schedule(sched).next(1, ref) as Date;

    assert.strictEqual(next.getFullYear(), 2025);
    assert.strictEqual(next.getMonth(), 5); // June
    assert.strictEqual(next.getDate(), 1);
    assert.strictEqual(next.getHours(), 14);
    assert.strictEqual(next.getMinutes(), 30);
  });
});

// ============================================================================
// ScheduleData constructed directly (not via parse)
// ============================================================================

describe('raw ScheduleData', () => {
  it('should handle schedule with only seconds defined', () => {
    const sched: ScheduleData = { schedules: [{ s: [0, 15, 30, 45] }] };
    const ref = new Date(2024, 0, 15, 10, 30, 16);
    const next = schedule.schedule(sched).next(1, ref) as Date;

    assert.strictEqual(next.getSeconds(), 30);
    assert.strictEqual(next.getMinutes(), 30);
  });

  it('should handle schedule with no constraints (every second)', () => {
    const sched: ScheduleData = { schedules: [{}] };
    const ref = new Date(2024, 0, 15, 10, 30, 30);
    const next = schedule.schedule(sched).next(1, ref) as Date;

    // No constraints → next second matches
    assert.strictEqual(next.getSeconds(), 31);
  });

  it('should handle schedule with only hour and minute', () => {
    const sched: ScheduleData = { schedules: [{ h: [12], m: [0] }] };
    const ref = new Date(2024, 0, 15, 12, 0, 0);
    const dates = schedule.schedule(sched).next(2, ref) as Date[];

    // No second constraint, so every second at 12:00 matches
    assert.strictEqual(dates[0].getHours(), 12);
    assert.strictEqual(dates[0].getMinutes(), 0);
    assert.strictEqual(dates[0].getSeconds(), 1);
    assert.strictEqual(dates[1].getSeconds(), 2);
  });
});

// ============================================================================
// Performance: the optimized algorithm should be fast for all schedule types
// ============================================================================

describe('performance', () => {
  it('should find daily schedule next occurrence in under 5ms', () => {
    const sched = schedule.parse.cron('0 3 * * *');
    // Worst case: just after 03:00, need to jump ~24 hours
    const ref = new Date(2024, 0, 15, 3, 0, 1);

    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      schedule.schedule(sched).next(1, ref);
    }
    const elapsed = performance.now() - start;

    // 1000 iterations should complete in well under 50ms (old algo would take seconds)
    assert.ok(elapsed < 50, `1000 daily next() calls took ${elapsed.toFixed(1)}ms, expected < 50ms`);
  });

  it('should find yearly schedule next occurrence quickly', () => {
    // Once per year: Jan 1 at midnight
    const sched = schedule.parse.cron('0 0 1 1 *');
    const ref = new Date(2024, 0, 1, 0, 0, 0); // exactly on match

    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      schedule.schedule(sched).next(1, ref);
    }
    const elapsed = performance.now() - start;

    assert.ok(elapsed < 50, `1000 yearly next() calls took ${elapsed.toFixed(1)}ms, expected < 50ms`);
  });

  it('should produce 365 daily occurrences in under 50ms', () => {
    const sched = schedule.parse.cron('0 3 * * *');
    const ref = new Date(2024, 0, 1, 0, 0, 0);

    const start = performance.now();
    const dates = schedule.schedule(sched).next(365, ref) as Date[];
    const elapsed = performance.now() - start;

    assert.strictEqual(dates.length, 365);
    assert.ok(elapsed < 50, `365 daily occurrences took ${elapsed.toFixed(1)}ms, expected < 50ms`);
  });

  it('should handle BaseWorker autoreschedule pattern efficiently', () => {
    // Simulates what happens every 30s in production
    const sched = schedule.parse.cron('0 3 * * *');
    sched.schedules[0].s = [0]; // BaseWorker override

    const start = performance.now();
    for (let i = 0; i < 10000; i++) {
      const ref = new Date(2024, 0, 15, 3, 0, i % 60); // varying reference seconds
      schedule.schedule(sched).next(1, ref);
    }
    const elapsed = performance.now() - start;

    // 10k calls should be trivial with the optimized algorithm
    assert.ok(
      elapsed < 100,
      `10000 autoreschedule pattern calls took ${elapsed.toFixed(1)}ms, expected < 100ms`,
    );
  });
});
