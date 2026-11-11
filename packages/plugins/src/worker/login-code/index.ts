import { type IPlugin } from '@unchainedshop/core';
import { LoginCodeWorker } from './adapter.ts';

export const LoginCodePlugin: IPlugin = {
  key: 'shop.unchained.worker-plugin.login-code',
  label: 'Login Code Worker Plugin',
  version: '1.0.0',

  adapters: [LoginCodeWorker],
};

export default LoginCodePlugin;
