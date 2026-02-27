/**
 * Schedule utilities - Native replacement for @breejs/later
 *
 * Supports:
 * - Cron expressions (standard 5-field: minute hour day-of-month month day-of-week)
 * - Simple text schedules ("every N seconds/minutes/hours")
 */

export interface ScheduleData {
  schedules: {
    /** Seconds (0-59) */
    s?: number[];
    /** Minutes (0-59) */
    m?: number[];
    /** Hours (0-23) */
    h?: number[];
    /** Days of month (1-31) */
    D?: number[];
    /** Months (1-12) */
    M?: number[];
    /** Days of week (1-7, where 1 is Sunday) */
    d?: number[];
  }[];
}

/**
 * Parse a cron expression into ScheduleData
 * Supports standard 5-field cron: minute hour day-of-month month day-of-week
 */
function parseCronField(field: string, min: number, max: number): number[] | undefined {
  if (field === '*') return undefined; // undefined means "all values"

  const values: number[] = [];

  // Handle comma-separated values
  const parts = field.split(',');
  for (const part of parts) {
    // Handle range with step (e.g., "0-30/5")
    const stepMatch = part.match(/^(\d+|\*)-?(\d+)?\/(\d+)$|^(\*|\d+-\d+)\/(\d+)$/);
    if (stepMatch || part.includes('/')) {
      const [rangePart, stepPart] = part.split('/');
      const step = parseInt(stepPart, 10);

      let start = min;
      let end = max;

      if (rangePart !== '*') {
        if (rangePart.includes('-')) {
          const [rangeStart, rangeEnd] = rangePart.split('-').map(Number);
          start = rangeStart;
          end = rangeEnd;
        } else {
          start = parseInt(rangePart, 10);
        }
      }

      for (let i = start; i <= end; i += step) {
        if (!values.includes(i)) values.push(i);
      }
      continue;
    }

    // Handle range (e.g., "1-5")
    if (part.includes('-')) {
      const [start, end] = part.split('-').map(Number);
      for (let i = start; i <= end; i++) {
        if (!values.includes(i)) values.push(i);
      }
      continue;
    }

    // Handle single value
    const num = parseInt(part, 10);
    if (!isNaN(num) && !values.includes(num)) {
      values.push(num);
    }
  }

  return values.length > 0 ? values.sort((a, b) => a - b) : undefined;
}

function parseCron(cronExpr: string): ScheduleData {
  const parts = cronExpr.trim().split(/\s+/);

  if (parts.length !== 5) {
    throw new Error(`Invalid cron expression: expected 5 fields, got ${parts.length}`);
  }

  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

  return {
    schedules: [
      {
        s: [0], // Default to second 0
        m: parseCronField(minute, 0, 59),
        h: parseCronField(hour, 0, 23),
        D: parseCronField(dayOfMonth, 1, 31),
        M: parseCronField(month, 1, 12),
        d: parseCronField(dayOfWeek, 0, 6),
      },
    ],
  };
}

/**
 * Parse a simple text schedule into ScheduleData
 * Supports: "every N seconds", "every N minutes", "every N hours"
 */
function parseText(text: string): ScheduleData {
  const match = text.toLowerCase().match(/every\s+(\d+)\s+(second|minute|hour)s?/);

  if (!match) {
    throw new Error(
      `Invalid schedule text: "${text}". Supported formats: "every N seconds/minutes/hours"`,
    );
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 'second': {
      // Generate array of seconds at the specified interval
      const seconds: number[] = [];
      for (let i = 0; i < 60; i += value) {
        seconds.push(i);
      }
      return {
        schedules: [{ s: seconds }],
      };
    }
    case 'minute': {
      // Generate array of minutes at the specified interval
      const minutes: number[] = [];
      for (let i = 0; i < 60; i += value) {
        minutes.push(i);
      }
      return {
        schedules: [{ s: [0], m: minutes }],
      };
    }
    case 'hour': {
      // Generate array of hours at the specified interval
      const hours: number[] = [];
      for (let i = 0; i < 24; i += value) {
        hours.push(i);
      }
      return {
        schedules: [{ s: [0], m: [0], h: hours }],
      };
    }
    default:
      throw new Error(`Unsupported time unit: ${unit}`);
  }
}

/**
 * Find the smallest value in a sorted array that is >= minVal.
 * Returns the value if found, or null if no value >= minVal exists.
 */
function findNextInSorted(sorted: number[], minVal: number): number | null {
  for (const v of sorted) {
    if (v >= minVal) return v;
  }
  return null;
}

/**
 * Get the number of days in a given month (1-12) of a given year.
 */
function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * Get the next occurrence(s) of a schedule from a reference date.
 *
 * Uses a field-advancing algorithm that directly jumps to the next matching
 * date instead of iterating second-by-second. For a daily schedule like
 * "0 3 * * *", this finds the next match in ~2 loop iterations instead of
 * ~86,400.
 */
function getNextOccurrences(scheduleData: ScheduleData, count: number, referenceDate: Date): Date[] {
  const results: Date[] = [];
  const sched = scheduleData.schedules[0];

  // Start from the reference date, but move to the next second
  const start = new Date(referenceDate.getTime());
  start.setMilliseconds(0);
  start.setSeconds(start.getSeconds() + 1);

  let year = start.getFullYear();
  let month = start.getMonth() + 1; // 1-12
  let day = start.getDate();
  let hour = start.getHours();
  let minute = start.getMinutes();
  let second = start.getSeconds();

  const maxYear = year + 5; // Safety limit

  search: while (results.length < count && year <= maxYear) {
    // --- MONTH ---
    if (sched.M) {
      const nextMonth = findNextInSorted(sched.M, month);
      if (nextMonth === null) {
        year++;
        month = sched.M[0];
        day = sched.D ? sched.D[0] : 1;
        hour = sched.h ? sched.h[0] : 0;
        minute = sched.m ? sched.m[0] : 0;
        second = sched.s ? sched.s[0] : 0;
        continue search;
      }
      if (nextMonth > month) {
        month = nextMonth;
        day = sched.D ? sched.D[0] : 1;
        hour = sched.h ? sched.h[0] : 0;
        minute = sched.m ? sched.m[0] : 0;
        second = sched.s ? sched.s[0] : 0;
      }
    }

    // --- DAY (day-of-month and/or day-of-week) ---
    const maxDay = daysInMonth(year, month);

    if (sched.D || sched.d) {
      let found = false;
      let candidateDay = day;

      while (candidateDay <= maxDay) {
        const matchesD = !sched.D || sched.D.includes(candidateDay);
        if (matchesD) {
          const dow = new Date(year, month - 1, candidateDay).getDay();
          const matchesDow = !sched.d || sched.d.includes(dow);
          if (matchesDow) {
            if (candidateDay > day) {
              hour = sched.h ? sched.h[0] : 0;
              minute = sched.m ? sched.m[0] : 0;
              second = sched.s ? sched.s[0] : 0;
            }
            day = candidateDay;
            found = true;
            break;
          }
        }
        candidateDay++;
      }

      if (!found) {
        month++;
        if (month > 12) {
          year++;
          month = sched.M ? sched.M[0] : 1;
        } else if (sched.M) {
          const nextM = findNextInSorted(sched.M, month);
          if (nextM === null) {
            year++;
            month = sched.M[0];
          } else {
            month = nextM;
          }
        }
        day = sched.D ? sched.D[0] : 1;
        hour = sched.h ? sched.h[0] : 0;
        minute = sched.m ? sched.m[0] : 0;
        second = sched.s ? sched.s[0] : 0;
        continue search;
      }
    } else if (day > maxDay) {
      month++;
      if (month > 12) {
        year++;
        month = sched.M ? sched.M[0] : 1;
      } else if (sched.M) {
        const nextM = findNextInSorted(sched.M, month);
        if (nextM === null) {
          year++;
          month = sched.M[0];
        } else {
          month = nextM;
        }
      }
      day = 1;
      hour = sched.h ? sched.h[0] : 0;
      minute = sched.m ? sched.m[0] : 0;
      second = sched.s ? sched.s[0] : 0;
      continue search;
    }

    // --- HOUR ---
    if (hour > 23) {
      day++;
      hour = sched.h ? sched.h[0] : 0;
      minute = sched.m ? sched.m[0] : 0;
      second = sched.s ? sched.s[0] : 0;
      continue search;
    }
    if (sched.h) {
      const nextHour = findNextInSorted(sched.h, hour);
      if (nextHour === null) {
        day++;
        hour = sched.h[0];
        minute = sched.m ? sched.m[0] : 0;
        second = sched.s ? sched.s[0] : 0;
        continue search;
      }
      if (nextHour > hour) {
        hour = nextHour;
        minute = sched.m ? sched.m[0] : 0;
        second = sched.s ? sched.s[0] : 0;
      }
    }

    // --- MINUTE ---
    if (minute > 59) {
      hour++;
      minute = sched.m ? sched.m[0] : 0;
      second = sched.s ? sched.s[0] : 0;
      continue search;
    }
    if (sched.m) {
      const nextMinute = findNextInSorted(sched.m, minute);
      if (nextMinute === null) {
        hour++;
        minute = sched.m[0];
        second = sched.s ? sched.s[0] : 0;
        continue search;
      }
      if (nextMinute > minute) {
        minute = nextMinute;
        second = sched.s ? sched.s[0] : 0;
      }
    }

    // --- SECOND ---
    if (second > 59) {
      minute++;
      second = sched.s ? sched.s[0] : 0;
      continue search;
    }
    if (sched.s) {
      const nextSecond = findNextInSorted(sched.s, second);
      if (nextSecond === null) {
        minute++;
        second = sched.s[0];
        continue search;
      }
      second = nextSecond;
    }

    // All fields match — we found a valid occurrence
    results.push(new Date(year, month - 1, day, hour, minute, second));

    // Advance past this result for finding the next occurrence
    second++;
  }

  return results;
}

/**
 * Schedule parser and calculator
 */
export const schedule = {
  /**
   * Parse schedule expressions
   */
  parse: {
    /**
     * Parse a cron expression (5-field format)
     * @example schedule.parse.cron('* * * * *') // every minute
     * @example schedule.parse.cron('0 15 * * *') // every day at 15:00
     */
    cron: parseCron,

    /**
     * Parse a text schedule
     * @example schedule.parse.text('every 2 seconds')
     * @example schedule.parse.text('every 30 minutes')
     */
    text: parseText,
  },

  /**
   * Create a schedule calculator from schedule data
   */
  schedule: (scheduleData: ScheduleData) => ({
    /**
     * Get the next occurrence(s) from a reference date
     * @param count Number of occurrences to return
     * @param referenceDate Date to start searching from
     * @returns Array of dates or single date if count is 1
     */
    next: (count: number, referenceDate: Date): Date | Date[] => {
      const results = getNextOccurrences(scheduleData, count, referenceDate);
      return count === 1 ? results[0] : results;
    },
  }),
};

export default schedule;
