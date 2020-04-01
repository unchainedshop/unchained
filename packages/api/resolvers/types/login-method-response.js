import { Users } from 'meteor/unchained:core-users';

export default {
  user({ id }) {
    const user = Users.findOne({ _id: id });
    user._inLoginMethodResponse = true; // eslint-disable-line
    return user;
  },
};
