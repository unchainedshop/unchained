export const LoginMethodResponse = {
  user({ user }) {
    user._inLoginMethodResponse = true; // eslint-disable-line
    return user;
  },
};
