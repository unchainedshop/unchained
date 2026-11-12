import { type IWorkerAdapter, WorkerAdapter } from '@unchainedshop/core';

export const LoginCodeWorker: IWorkerAdapter<{ email: string }, { sent: boolean }> = {
  ...WorkerAdapter,

  key: 'shop.unchained.worker-plugin.login-code',
  label: 'Mail a login link with a one-time code to the user of an address',
  version: '1.0.0',
  type: 'LOGIN_CODE',

  doWork: async ({ email }, { services }) => {
    return { success: true, result: { sent: await services.users.sendLoginCode(email) } };
  },
};

export default LoginCodeWorker;
