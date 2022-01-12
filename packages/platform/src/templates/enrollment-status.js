import { MessagingDirector } from 'meteor/unchained:core-messaging';
import { Enrollments } from 'meteor/unchained:core-enrollments';

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

export default ({ enrollmentId, locale }) => {
  const enrollment = Enrollments.findOne({ _id: enrollmentId });
  const user = enrollment.user();
  const subject = `${EMAIL_WEBSITE_NAME}: Updated Enrollment / ${enrollment.enrollmentNumber}`;

  const templateVariables = {
    subject,
    url: `${UI_ENDPOINT}/enrollment?_id=${enrollment._id}`,
    enrollment,
    locale,
  };

  return [
    {
      type: 'EMAIL',
      input: {
        from: EMAIL_FROM,
        to: user.primaryEmail()?.address,
        subject,
        text: MessagingDirector.renderToText(textTemplate, templateVariables),
      },
    },
  ];
};
