import { type IWorkerAdapter, WorkerAdapter } from '@unchainedshop/core';

export const LoginCodeWorker: IWorkerAdapter<{ email: string }, { sent: boolean }> = {
  ...WorkerAdapter,

  key: 'shop.unchained.worker-plugin.login-code',
  label: 'Mail a login link with a one-time code to the user of an address',
  version: '1.0.0',
  type: 'LOGIN_CODE',

  doWork: async ({ email }, { modules }) => {
    const user = await modules.users.findUserByEmail(email);
    const created =
      user &&
      !user.deleted &&
      (await modules.users.loginCode.createChallenge({ userId: user._id, email }));
    return { success: true, result: { sent: Boolean(created) } };
  },
};

export default LoginCodeWorker;
