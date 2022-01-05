import { log, LogLevel } from 'meteor/unchained:logger';

import { IEnrollmentAdapter } from '@unchainedshop/types/enrollments';

export const EnrollmentAdapter: IEnrollmentAdapter = {
  key: '',
  label: '',
  version: '',
  orderIndex: 0,

  log(message: string, { level = LogLevel.Debug, ...options } = {}) {
    return log(message, { level, ...options });
  },
};
