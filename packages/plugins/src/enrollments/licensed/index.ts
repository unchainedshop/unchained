import { type IPlugin } from '@unchainedshop/core';
import { LicensedEnrollments } from './adapter.ts';

// Plugin definition
export const LicensedEnrollmentsPlugin: IPlugin = {
  key: 'shop.unchained.enrollments.licensed',
  label: 'Licensed Enrollments Plugin',
  version: '1.0.0',

  adapters: [LicensedEnrollments],
};

export default LicensedEnrollmentsPlugin;

// Helpers
export { rangeMatcher } from './adapter.ts';
