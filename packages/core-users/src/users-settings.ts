import { User, UserSettings, UserSettingsOptions } from '@unchainedshop/types/user.js';
import { Schemas } from '@unchainedshop/utils';
import { mongodb } from '@unchainedshop/mongodb';

export const userSettings: UserSettings = {
  autoMessagingAfterUserCreation: null,
  mergeUserCartsOnLogin: null,
  validateEmail: null,
  validateUsername: null,
  validateNewUser: null,
  validatePassword: null,

  configureSettings: (
    {
      mergeUserCartsOnLogin,
      autoMessagingAfterUserCreation,
      validateEmail,
      validateUsername,
      validateNewUser,
      validatePassword,
    }: UserSettingsOptions,
    db: mongodb.Db,
  ) => {
    const defaultAutoMessagingAfterUserCreation = true;
    const defaultMergeUserCartsOnLogin = true;

    const defaultValidateEmail = async (rawEmail: string) => {
      const email = rawEmail.toLowerCase().trim();
      if (!email?.includes?.('@')) return false;
      const emailAlreadyExists = await db
        .collection('users')
        .countDocuments({ 'emails.address': { $regex: email, $options: 'i' } }, { limit: 1 });
      if (emailAlreadyExists) return false;
      return true;
    };
    const defaultValidateUsername = async (rawUsername: string) => {
      const username = rawUsername.toLowerCase().trim();
      if (username?.length < 3) return false;
      const usernameAlreadyExists = await db
        .collection('users')
        .countDocuments({ username: { $regex: username, $options: 'i' } }, { limit: 1 });
      if (usernameAlreadyExists) return false;
      return true;
    };
    const defaultValidateNewUser = async (user: User) => {
      const customSchema = Schemas.User.omit(
        '_id',
        'created',
        'roles',
        'emails',
        'services',
        'initialPassword',
      );
      customSchema.validate(user);
      return Schemas.User.clean(user) as User;
    };

    const defaultValidatePassword = async (password: string) => {
      return password?.length > 8;
    };

    userSettings.mergeUserCartsOnLogin = mergeUserCartsOnLogin ?? defaultMergeUserCartsOnLogin;
    userSettings.autoMessagingAfterUserCreation =
      autoMessagingAfterUserCreation ?? defaultAutoMessagingAfterUserCreation;
    userSettings.validateEmail = validateEmail || defaultValidateEmail;
    userSettings.validateUsername = validateUsername || defaultValidateUsername;
    userSettings.validateNewUser = validateNewUser || defaultValidateNewUser;
    userSettings.validatePassword = validatePassword || defaultValidatePassword;
  },
};
