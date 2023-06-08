import later from '@breejs/later';
import { EnrollmentsSettingsOptions } from '@unchainedshop/types/enrollments.js';
import { generateRandomHash } from '@unchainedshop/utils';

const everyHourSchedule = later.parse.text('every 59 minutes');

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
