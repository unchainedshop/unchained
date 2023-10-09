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

    // accountsPassword.options.sendVerificationEmailAfterSignup = false; // eslint-disable-line
    // accountsPassword.options.validateNewUser = (user) => { // eslint-disable-line
    //   const customSchema = Schemas.User.extend({
    //     password: String,
    //     email: String,
    //   }).omit('_id', 'created', 'emails', 'services');

    //   customSchema.validate(user);
    //   return customSchema.clean(user);
    // };

    // Object.keys(server).forEach((key) => {
    //   accountsServer.options[key] = server[key];// eslint-disable-line
    // });
    // Object.keys(password).forEach((key) => {
    //   accountsPassword.options[key] = password[key];// eslint-disable-line
    // });
  },
};
