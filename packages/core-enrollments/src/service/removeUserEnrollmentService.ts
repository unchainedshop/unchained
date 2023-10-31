/* eslint-disable no-case-declarations */

import { RemoveUserEnrollmentService } from '@unchainedshop/types/enrollments.js';

export const removeUserEnrollmentService: RemoveUserEnrollmentService = async (
  { userId },
  unchainedAPI,
) => {
  const { modules } = unchainedAPI;
  modules.enrollments.removeEnrollmentsByUserId(userId);
  return true;
};
