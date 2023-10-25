import { UsersSettings, UsersSettingsOptions } from '@unchainedshop/types/user.js';
// import { Schemas } from '@unchainedshop/utils';

const defaultAutoMessagingAfterUserCreation = true;
const defaultMergeUserCartsOnLogin = true;

export const userSettings: UsersSettings = {
  autoMessagingAfterUserCreation: null,
  mergeUserCartsOnLogin: null,
  configureSettings: ({
    mergeUserCartsOnLogin = defaultMergeUserCartsOnLogin,
    autoMessagingAfterUserCreation = defaultAutoMessagingAfterUserCreation,
  }: UsersSettingsOptions) => {
    userSettings.mergeUserCartsOnLogin = mergeUserCartsOnLogin ?? defaultMergeUserCartsOnLogin;
    userSettings.autoMessagingAfterUserCreation =
      autoMessagingAfterUserCreation ?? defaultAutoMessagingAfterUserCreation;

    // accountsPassword.options.validateNewUser = (user) => { // eslint-disable-line
    //   const customSchema = Schemas.User.extend({
    //     password: String,
    //     email: String,
    //   }).omit('_id', 'created', 'emails', 'services');

    //   customSchema.validate(user);
    //   return customSchema.clean(user);
    // };
  },
};
