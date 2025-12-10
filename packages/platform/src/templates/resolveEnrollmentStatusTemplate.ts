import type { TemplateResolver } from '@unchainedshop/core';

const { EMAIL_FROM, EMAIL_WEBSITE_NAME, EMAIL_WEBSITE_URL } = process.env;

export const resolveEnrollmentStatusTemplate: TemplateResolver = async ({ enrollmentId }, context) => {
  const { modules } = context;
  const enrollment = await modules.enrollments.findEnrollment({ enrollmentId });
  const user = await modules.users.findUserById(enrollment.userId);

  const subject = `${EMAIL_WEBSITE_NAME}: Updated Enrollment / ${enrollment.enrollmentNumber}`;
  const url = `${EMAIL_WEBSITE_URL}/enrollment?_id=${enrollment._id}`;

  const text = `
  ${subject}\n
  \n
  Status: ${enrollment.status}
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
