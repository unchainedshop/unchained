import later from 'later';
import { generateRandomHash } from 'meteor/unchained:utils';

const everyHourSchedule = later.parse.text('every 59 minutes');
const emptyObject = () => {
  return {};
};

const settings = {
  autoSchedulingSchedule: null,
  autoSchedulingInput: null,
  enrollmentNumberHashFn: null,
  load({
    autoSchedulingSchedule = everyHourSchedule,
    autoSchedulingInput = emptyObject,
    enrollmentNumberHashFn = generateRandomHash,
  } = {}) {
    this.autoSchedulingSchedule = autoSchedulingSchedule;
    this.autoSchedulingInput = autoSchedulingInput || emptyObject;
    this.enrollmentNumberHashFn = enrollmentNumberHashFn;
  },
};

export default settings;
