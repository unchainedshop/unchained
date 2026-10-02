import { type IPlugin } from '@unchainedshop/core';
import { BoxOffice } from './adapter.ts';

export const BoxOfficePlugin: IPlugin = {
  key: 'shop.unchained.payment.box-office',
  label: 'Box Office Payment Plugin',
  version: '1.0.0',

  adapters: [BoxOffice],
};

export default BoxOfficePlugin;

export { BoxOffice } from './adapter.ts';
