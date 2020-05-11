const everyHour = 'every 59 minutes';
const emptyObject = () => {
  return {};
};

const settings = {
  autoSchedulingCronText: null,
  autoSchedulingInput: null,
  load({
    autoSchedulingCronText = everyHour,
    autoSchedulingInput = emptyObject,
  } = {}) {
    this.autoSchedulingCronText = autoSchedulingCronText;
    this.autoSchedulingInput = autoSchedulingInput || emptyObject;
  },
};

export default settings;
