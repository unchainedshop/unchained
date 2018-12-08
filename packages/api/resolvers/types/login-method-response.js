import { Users } from 'meteor/unchained:core-users';

export default {
  user({ id }) {
    return Users.findOne({ _id: id });
  },
};
