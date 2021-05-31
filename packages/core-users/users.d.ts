declare module 'meteor/unchained:core-users' {
  import { Mongo } from 'meteor/mongo';

  type Email = {
    address: string;
    verified?: boolean;
  };

  type User = {
    _id: string;
    emails?: Email[];
    username: string;
    lastLogin?: {
      timestamp?: Date;
      locale?: string;
      countryContext?: string;
      remoteAddress?: string;
      remotePort?: string;
      userAgent?: string;
    };
    profile?: {
      displayName?: string;
      birthday?: Date;
      phoneMobile?: string;
      gender?: string;
      address?: any;
      customFields?: any;
    };
    lastContact?: {
      telNumber?: string;
      emailAddrss?: string;
    };
    guest?: boolean;
    tags?: string[];
    avatarId?: string;
    services?: any;
    roles?: string[];
  };

  class UsersCollection extends Mongo.Collection<User> {
    findUser: (args: {
      userId?: string;
      resetToken?: string;
      hashedToken?: string;
    }) => User;
  }

  const Users: UsersCollection;

  // eslint-disable-next-line import/prefer-default-export
  export { Users };
}
