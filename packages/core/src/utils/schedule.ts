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
 * Get the next occurrence(s) of a schedule from a reference date
 */
function getNextOccurrences(scheduleData: ScheduleData, count: number, referenceDate: Date): Date[] {
  const results: Date[] = [];
  const schedule = scheduleData.schedules[0];

  // Start from the reference date, but move to the next second
  const current = new Date(referenceDate.getTime());
  current.setMilliseconds(0);
  current.setSeconds(current.getSeconds() + 1);

  const maxIterations = 366 * 24 * 60 * 60; // Max 1 year of seconds to prevent infinite loops
  let iterations = 0;

  while (results.length < count && iterations < maxIterations) {
    iterations++;

    const month = current.getMonth() + 1; // 1-12
    const dayOfMonth = current.getDate(); // 1-31
    const dayOfWeek = current.getDay(); // 0-6
    const hour = current.getHours(); // 0-23
    const minute = current.getMinutes(); // 0-59
    const second = current.getSeconds(); // 0-59

    // Check if current time matches the schedule
    const matchesMonth = !schedule.M || schedule.M.includes(month);
    const matchesDay = !schedule.D || schedule.D.includes(dayOfMonth);
    const matchesDayOfWeek = !schedule.d || schedule.d.includes(dayOfWeek);
    const matchesHour = !schedule.h || schedule.h.includes(hour);
    const matchesMinute = !schedule.m || schedule.m.includes(minute);
    const matchesSecond = !schedule.s || schedule.s.includes(second);

    if (
      matchesMonth &&
      matchesDay &&
      matchesDayOfWeek &&
      matchesHour &&
      matchesMinute &&
      matchesSecond
    ) {
      results.push(new Date(current));
    }

    // Move to next second
    current.setSeconds(current.getSeconds() + 1);
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
