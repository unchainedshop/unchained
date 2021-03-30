import later from 'later';

const everyHourSchedule = later.parse.text('every 59 minutes');
const emptyObject = () => {
  return {};
};

const settings = {
  autoSchedulingSchedule: null,
  autoSchedulingInput: null,
  load({
    autoSchedulingSchedule = everyHourSchedule,
    autoSchedulingInput = emptyObject,
  } = {}) {
    this.autoSchedulingSchedule = autoSchedulingSchedule;
    this.autoSchedulingInput = autoSchedulingInput || emptyObject;
  },
};

export default settings;
