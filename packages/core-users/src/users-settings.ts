const defaultAutoMessagingAfterUserCreation = true;

export const userSettings = {
  autoMessagingAfterUserCreation: null,
  load({
    autoMessagingAfterUserCreation = defaultAutoMessagingAfterUserCreation,
  } = {}) {
    this.autoMessagingAfterUserCreation =
      autoMessagingAfterUserCreation ?? defaultAutoMessagingAfterUserCreation;
  },
};
