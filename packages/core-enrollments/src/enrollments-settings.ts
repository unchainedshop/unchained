import later from '@breejs/later';
import { generateRandomHash } from '@unchainedshop/utils';
import { Enrollment } from './types.js';

import type { WorkerSchedule } from '@unchainedshop/core-worker';

const everyHourSchedule = later.parse.text('every 59 minutes');

export interface EnrollmentsSettingsOptions {
  autoSchedulingSchedule?: WorkerSchedule;
  enrollmentNumberHashFn?: (enrollment: Enrollment, index: number) => string;
}

export const enrollmentsSettings = {
  autoSchedulingSchedule: null,
  enrollmentNumberHashFn: null,
  configureSettings({
    autoSchedulingSchedule = everyHourSchedule,
    enrollmentNumberHashFn = generateRandomHash,
  }: EnrollmentsSettingsOptions = {}) {
    this.autoSchedulingSchedule = autoSchedulingSchedule;
    this.enrollmentNumberHashFn = enrollmentNumberHashFn;
  },
};
