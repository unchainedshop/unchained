import later from '@breejs/later';
import { EnrollmentsSettingsOptions } from '@unchainedshop/types/enrollments.js';
import { generateRandomHash } from '@unchainedshop/utils';

const everyHourSchedule = later.parse.text('every 59 minutes');
const emptyObject = () => {
  return {};
};

export const enrollmentsSettings = {
  autoSchedulingSchedule: null,
  autoSchedulingInput: null,
  enrollmentNumberHashFn: null,
  configureSettings({
    autoSchedulingSchedule = everyHourSchedule,
    autoSchedulingInput = emptyObject,
    enrollmentNumberHashFn = generateRandomHash,
  }: EnrollmentsSettingsOptions = {}) {
    this.autoSchedulingSchedule = autoSchedulingSchedule;
    this.autoSchedulingInput = autoSchedulingInput || emptyObject;
    this.enrollmentNumberHashFn = enrollmentNumberHashFn;
  },
};
