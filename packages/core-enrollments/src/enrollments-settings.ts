import later from '@breejs/later';
import { generateRandomHash } from '@unchainedshop/utils';
import { Enrollment } from './db/EnrollmentsCollection.js';

const everyHourSchedule = later.parse.text('every 59 minutes');

export interface EnrollmentSettings {
  autoSchedulingSchedule: later.ScheduleData;
  enrollmentNumberHashFn: (enrollment: Enrollment, index: number) => string;
  configureSettings: (options?: EnrollmentsSettingsOptions) => void;
}

export type EnrollmentsSettingsOptions = Omit<Partial<typeof enrollmentsSettings>, 'configureSettings'>;

export const enrollmentsSettings: EnrollmentSettings = {
  autoSchedulingSchedule: everyHourSchedule,
  enrollmentNumberHashFn: generateRandomHash,
  configureSettings({ autoSchedulingSchedule, enrollmentNumberHashFn } = {}) {
    this.autoSchedulingSchedule = autoSchedulingSchedule || everyHourSchedule;
    this.enrollmentNumberHashFn = enrollmentNumberHashFn || generateRandomHash;
  },
};
