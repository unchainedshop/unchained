import { EnrollmentServices } from '@unchainedshop/types/enrollments.js';
import { removeUserEnrollmentService } from './removeUserEnrollmentService.js';

export const enrollmentServices: EnrollmentServices = {
  removeUserEnrollments: removeUserEnrollmentService,
};
