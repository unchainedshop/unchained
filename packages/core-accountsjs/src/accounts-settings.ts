const defaultAutoMessagingAfterUserCreation = true;
const defaultMergeUserCartsOnLogin = true;

export const accountsSettings = {
  autoMessagingAfterUserCreation: null,
  mergeUserCartsOnLogin: null,
  configureSettings: ({
    mergeUserCartsOnLogin = defaultMergeUserCartsOnLogin,
    autoMessagingAfterUserCreation = defaultAutoMessagingAfterUserCreation,
  }) => {
    accountsSettings.mergeUserCartsOnLogin = mergeUserCartsOnLogin ?? defaultMergeUserCartsOnLogin;
    accountsSettings.autoMessagingAfterUserCreation =
      autoMessagingAfterUserCreation ?? defaultAutoMessagingAfterUserCreation;
  },
};
