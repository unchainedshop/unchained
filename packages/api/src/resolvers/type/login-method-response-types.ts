import { IN_LOGIN_RESPONSE } from '../../context.ts';

export const LoginMethodResponse = {
  user({ user }) {
    user[IN_LOGIN_RESPONSE] = true;
    return user;
  },
};
