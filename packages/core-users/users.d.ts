declare module 'meteor/unchained:core-users' {
  type User = {
    _id: string;
    displayName?: string;
    birthday?: Date;
    phoneMobile?: string;
    gender?: string;
    address?: any;
    customFields?: any;
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
