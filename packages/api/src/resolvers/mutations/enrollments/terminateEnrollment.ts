import type { Context } from '../../../context.ts';
import { EnrollmentStatus, type EnrollmentTerminationReason } from '@unchainedshop/core-enrollments';
import { log } from '@unchainedshop/logger';
import {
  EnrollmentNotFoundError,
  EnrollmentWrongStatusError,
  EnrollmentTerminationNotAllowedError,
  InvalidIdError,
} from '../../../errors.ts';

export default async function terminateEnrollment(
  root: never,
  params: { enrollmentId: string; reason?: EnrollmentTerminationReason; comment?: string },
  context: Context,
) {
  const { modules, services, userId } = context;
  const { enrollmentId, reason, comment } = params;

  log('mutation terminateEnrollment', { userId });

  if (!enrollmentId) throw new InvalidIdError({ enrollmentId });

  const enrollment = await modules.enrollments.findEnrollment({
    enrollmentId,
  });
  if (!enrollment) throw new EnrollmentNotFoundError({ enrollmentId });

  if (enrollment.status === EnrollmentStatus.TERMINATED) {
    throw new EnrollmentWrongStatusError({ status: enrollment.status });
  }

  try {
    return await services.enrollments.terminateEnrollment(enrollment, { reason, comment });
  } catch (e) {
    if (e.name === 'EnrollmentTerminationNotAllowedError') {
      throw new EnrollmentTerminationNotAllowedError({ enrollmentId });
    }
    throw e;
  }
}
