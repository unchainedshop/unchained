declare module 'meteor/unchained:core-users' {
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

  // TODO: should be `extends Mongo.Collection<User>`
  class Users {
    static findUser(args: {
      userId?: string;
      resetToken?: string;
      hashedToken?: string;
    }): User;
  }

  // eslint-disable-next-line import/prefer-default-export
  export { Users };
}
