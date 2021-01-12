const defaultAutoMessagingAfterUserCreation = true;

const everySecondDay = 'every 2 days';
const emptyObject = () => {
  return {};
};

const settings = {
  autoMessagingAfterUserCreation: null,
  autoSchedulingCronText: null,
  autoSchedulingInput: null,
  load({
    autoMessagingAfterUserCreation = defaultAutoMessagingAfterUserCreation,
    autoSchedulingCronText = everySecondDay,
    autoSchedulingInput = emptyObject,
  } = {}) {
    this.autoMessagingAfterUserCreation =
      autoMessagingAfterUserCreation ?? defaultAutoMessagingAfterUserCreation;
    this.autoSchedulingCronText = autoSchedulingCronText;
    this.autoSchedulingInput = autoSchedulingInput || emptyObject;
  },
};

export default settings;
