export const LoginMethodResponse = {
  user({ user }) {
    user._inLoginMethodResponse = true;
    return user;
  },
};
