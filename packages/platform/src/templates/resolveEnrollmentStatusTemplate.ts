import { TemplateResolver } from '@unchainedshop/core';
import mustache from 'mustache';
const { EMAIL_FROM, EMAIL_WEBSITE_NAME, EMAIL_WEBSITE_URL } = process.env;

const textTemplate = `
  {{subject}}\n
  \n
  Status: {{enrollment.status}}
  \n
  -----------------\n
  Show: {{url}}\n
  -----------------\n
`;

export const resolveEnrollmentStatusTemplate: TemplateResolver = async (
  { enrollmentId, locale },
  context,
) => {
  const { modules } = context;
  const enrollment = await modules.enrollments.findEnrollment({ enrollmentId });
  const user = await modules.users.findUserById(enrollment.userId);

  const subject = `${EMAIL_WEBSITE_NAME}: Updated Enrollment / ${enrollment.enrollmentNumber}`;

  const text = mustache.render(
    textTemplate,
    {
      enrollment,
      locale,
      subject,
      url: `${EMAIL_WEBSITE_URL}/enrollment?_id=${enrollment._id}`,
    },
    undefined,
    { escape: (t) => t },
  );

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
