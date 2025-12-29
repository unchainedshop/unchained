import { generateRandomHash } from '@unchainedshop/utils';
import type { Enrollment } from './db/EnrollmentsCollection.ts';

export interface ScheduleData {
  schedules: {
    s?: number[];
    m?: number[];
    h?: number[];
    D?: number[];
    M?: number[];
    d?: number[];
  }[];
}

// "every 59 minutes" - minutes 0 and 59
const everyHourSchedule: ScheduleData = {
  schedules: [{ s: [0], m: [0, 59] }],
};

export interface EnrollmentSettings {
  autoSchedulingSchedule: ScheduleData;
  enrollmentNumberHashFn: (enrollment: Enrollment, index: number) => string;
  configureSettings: (options?: EnrollmentsSettingsOptions) => void;
}

export type EnrollmentsSettingsOptions = Omit<Partial<EnrollmentSettings>, 'configureSettings'>;

export const enrollmentsSettings: EnrollmentSettings = {
  autoSchedulingSchedule: everyHourSchedule,
  enrollmentNumberHashFn: generateRandomHash,
  configureSettings({ autoSchedulingSchedule, enrollmentNumberHashFn } = {}) {
    this.autoSchedulingSchedule = autoSchedulingSchedule || everyHourSchedule;
    this.enrollmentNumberHashFn = enrollmentNumberHashFn || generateRandomHash;
  },
};
