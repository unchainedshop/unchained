import { User, UsersSettings, UsersSettingsOptions } from '@unchainedshop/types/user.js';
import { Schemas } from '@unchainedshop/utils';

const defaultAutoMessagingAfterUserCreation = true;
const defaultMergeUserCartsOnLogin = true;
const defaultValidateEmail = (email: string) => true;
const defaultValidateUsername = (username: string) => true;
const defaultValidateNewUser = async (user: User) => {
  const customSchema = Schemas.User.extend({
    password: String,
    email: String,
  }).omit('_id', 'created', 'emails', 'services');
  customSchema.validate(user);
  return Schemas.User.clean(user) as User;
};

export const userSettings: UsersSettings = {
  autoMessagingAfterUserCreation: null,
  mergeUserCartsOnLogin: null,
  validateEmail: null,
  validateUsername: null,
  validateNewUser: null,

  configureSettings: ({
    mergeUserCartsOnLogin = defaultMergeUserCartsOnLogin,
    autoMessagingAfterUserCreation = defaultAutoMessagingAfterUserCreation,
    validateEmail = defaultValidateEmail,
    validateUsername = defaultValidateUsername,
    validateNewUser = defaultValidateNewUser,
  }: UsersSettingsOptions) => {
    userSettings.mergeUserCartsOnLogin = mergeUserCartsOnLogin ?? defaultMergeUserCartsOnLogin;
    userSettings.autoMessagingAfterUserCreation =
      autoMessagingAfterUserCreation ?? defaultAutoMessagingAfterUserCreation;
    userSettings.validateEmail = validateEmail ?? defaultValidateEmail;
    userSettings.validateUsername = validateUsername ?? defaultValidateUsername;
    userSettings.validateNewUser = validateNewUser ?? defaultValidateNewUser;
  },
};
