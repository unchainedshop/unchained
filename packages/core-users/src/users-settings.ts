const defaultAutoMessagingAfterUserCreation = true;

export const usersSettings = {
  autoMessagingAfterUserCreation: null,
  load({
    autoMessagingAfterUserCreation = defaultAutoMessagingAfterUserCreation,
  } = {}) {
    this.autoMessagingAfterUserCreation =
      autoMessagingAfterUserCreation ?? defaultAutoMessagingAfterUserCreation;
  },
};
