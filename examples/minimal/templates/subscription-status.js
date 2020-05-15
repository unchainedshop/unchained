import { MessagingDirector } from 'meteor/unchained:core-messaging';
import { Subscriptions } from 'meteor/unchained:core-subscriptions';

const {
  EMAIL_FROM,
  EMAIL_WEBSITE_NAME = 'Unchained Webshop',
  UI_ENDPOINT,
} = process.env;

const textTemplate = `
  {{subject}}\n
  \n
  Status: {{subscription.status}}
  \n
  -----------------\n
  Show: {{url}}\n
  -----------------\n
`;

MessagingDirector.configureTemplate(
  'SUBSCRIPTION_STATUS',
  ({ subscriptionId, locale }) => {
    const subscription = Subscriptions.findOne({ _id: subscriptionId });
    const user = subscription.user();
    const subject = `${EMAIL_WEBSITE_NAME}: Updated Subscription / ${subscription.subscriptionNumber}`;

    const templateVariables = {
      subject,
      mailPrefix: `${subscription.subscriptionNumber}_`,
      url: `${UI_ENDPOINT}/subscription?_id=${subscription._id}&otp=${
        subscription.subscriptionNumber || ''
      }`,
      subscription,
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
  }
);
