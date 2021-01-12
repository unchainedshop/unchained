import { Users } from 'meteor/unchained:core-users';

export default {
  user({ id }) {
    const user = Users.findUser({ userId: id });
    user._inLoginMethodResponse = true; // eslint-disable-line
    return user;
  },
};
