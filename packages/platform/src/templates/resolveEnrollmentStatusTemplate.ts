import type { TemplateResolver } from '@unchainedshop/core';

const { EMAIL_FROM, EMAIL_WEBSITE_NAME, EMAIL_WEBSITE_URL } = process.env;

export const resolveEnrollmentStatusTemplate: TemplateResolver = async (
  { enrollmentId, locale },
  context,
) => {
  const { modules } = context;
  const enrollment = await modules.enrollments.findEnrollment({ enrollmentId });
  const user = await modules.users.findUserById(enrollment.userId);

  const subject = `${EMAIL_WEBSITE_NAME}: Updated Enrollment / ${enrollment.enrollmentNumber || enrollment._id}`;
  const url = `${EMAIL_WEBSITE_URL}/enrollment?_id=${enrollment._id}`;

  const formatDate = (date: Date) =>
    new Date(date).toLocaleDateString(locale || 'en', { dateStyle: 'long' });
  const scheduledDates = [
    enrollment.expires && `Ends: ${formatDate(enrollment.expires)}`,
    enrollment.resumeAt && `Resumes: ${formatDate(enrollment.resumeAt)}`,
    enrollment.minimumCommitmentEnd &&
      `Minimum commitment until: ${formatDate(enrollment.minimumCommitmentEnd)}`,
  ].filter(Boolean);

  const text = `
  ${subject}\n
  \n
  Status: ${enrollment.status}
  ${scheduledDates.join('\n  ')}
  \n
  -----------------\n
  Show: ${url}\n
  -----------------\n
`;

  return [
    {
      type: 'EMAIL',
      input: {
        from: EMAIL_FROM || 'noreply@unchained.local',
        to: modules.users.primaryEmail(user)?.address,
        subject,
        text,
      },
    },
  ];
};
