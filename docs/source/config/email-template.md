---
title: "Email template"
description: Customize default email templates
---

# Email template configuration

Customizing the default email templates is simple:

All you have to do is overwrite the existing message template listed below using `MessaginDirector` at start up.
existing message templates are defined [here](https://github.com/unchainedshop/unchained/blob/master/packages/platform/setup-templates.js):

- ACCOUNT_ACTION
- DELIVERY
- ORDER_CONFIRMATION
- QUOTATION_STATUS
- SUBSCRIPTION_STATUS

Internally unchained uses [mjml format](https://documentation.mjml.io/) or simple text for email templating.

first import `MessagingDirector` from `unchained:core-messaging`. for demonstration purpose lets just use simple text based template but feel free to create full fledge [mjml format](https://documentation.mjml.io/) template or use any other kind of rendering engine. See the existing templates for reference.

```
import { MessagingDirector } from 'meteor/unchained:core-messaging';

const template = `
Hello {{quantity}} thank you for visiting unchained store {{date}} we hope you become part of our community member in the future :).`

```

what is left now is use this to ovewright any of the existing email template. in this case we will over `ACCOUNT_ACTION`.

next write the function that will combine this template with variables used in it using `MessagingDirector.renderToText` static function and return email configuration array of object/s.

Pro Tip: Messaging in unchained is not tied to E-Mails, the `type` that is return inside the config array is just a worker type and the input is just added to the work queue. So you could write your own "SMS_TO_BOSS" work type and call some Twilio API from there. You could even combine SMS_TO_BOSS wit the default e-mail and send the message via two channels.

```
const generateorderConfirmationTemplate ({ name }) => {

  const templateVariables = {
    name,
    date: new Date().toString()
  };
  const text = MessagingDirector.renderToText(template, templateVariables);
  return [
    {
      type: 'EMAIL',
      input: {
        from: 'sender@domain.com',
        to: 'reciever@domain.com',
        subject: 'Custom unchained email',
        text,
      },
    },
  ];
};

```

lastly we use `MessagingDirector.configureTemplate` after `startPlatform` on system boot to overwrite the default email template.

```
import { Meteor } from 'meteor/meteor';
import { MessageTypes } from 'meteor/unchained:platform';

Meteor.startup(() => {
  ...
  startPlatform({...});
  ...
  MessagingDirector.configureTemplate(
    MessageTypes.ORDER_CONFIRMATION,
    orderConfirmationTemplate: generateorderConfirmationTemplate({name: 'john doe'}),
  );
});

```

Note the second parameter to `MessagingDirector.configureTemplate` accepts array of email configuration, this will enable you to send multiple email to for a certation trigger to multiple reciepents. one such use case might be you need a copy of order confirmation email sent out to your customers sent to you also.
