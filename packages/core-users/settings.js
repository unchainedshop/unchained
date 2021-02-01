const defaultAutoMessagingAfterUserCreation = true;

const settings = {
  autoMessagingAfterUserCreation: null,
  load({
    autoMessagingAfterUserCreation = defaultAutoMessagingAfterUserCreation,
  } = {}) {
    this.autoMessagingAfterUserCreation =
      autoMessagingAfterUserCreation ?? defaultAutoMessagingAfterUserCreation;
  },
};

export default settings;
