import { TemplateResolver } from '@unchainedshop/types/messaging';

const {
  EMAIL_FROM,
  EMAIL_WEBSITE_NAME = 'Unchained Webshop',
  UI_ENDPOINT,
} = process.env;

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
  context
) => {
  const { modules } = context;
  const enrollment = await modules.enrollments.findEnrollment({ enrollmentId });
  const user = await modules.users.findUser({ userId: enrollment.userId });

  const subject = `${EMAIL_WEBSITE_NAME}: Updated Enrollment / ${enrollment.enrollmentNumber}`;

  const data = {
    enrollment,
    locale,
    subject,
    url: `${UI_ENDPOINT}/enrollment?_id=${enrollment._id}`,
  };

  return [
    {
      type: 'EMAIL',
      input: {
        from: EMAIL_FROM,
        to: modules.users.primaryEmail(user)?.address,
        subject,
        text: modules.messaging.renderToText(textTemplate, data),
      },
    },
  ];
};
