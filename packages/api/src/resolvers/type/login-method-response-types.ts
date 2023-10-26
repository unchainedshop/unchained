export const LoginMethodResponse = {
  id({ user }) {
    return user._id;
  },

  user({ user }) {
    user._inLoginMethodResponse = true; // eslint-disable-line
    return user;
  },
};
