---
sidebar_position: 7
title: Messaging
sidebar_label: Messaging
---

:::
 Customize messaging 
:::

It is possible to trigger `SMS` or `EMAIL` notification for various operation performed. Notification are are added to the work queue for processing, By default Email notification is triggered by the engine to the following operations.
- User Enrollment
- User email verification
- Order delivery
- Order confirmation
- Order rejection
- Quotation status change

You can override the default template and/or add your own email/SMS notification. In order to add a custom `EMAIL` or `SMS` notification you must create a function that implement the [TemplateResolver](https://docs.unchained.shop/types/types/messaging.TemplateResolver.html) and register the template the [IMessagingDirector](https://docs.unchained.shop/types/types/messaging.IMessagingDirector.html). After that you only need to add work in the queue with the corresponding type(EMAIL/SMS) with template name you want to use and any required dynamic data required in the template.

Bellow is an example of a simple error notification email message configuration setup, that will send an automated email to support team when a user encounter error during some action.

## Implement TemplateResolver

```typescript
const ERROR_EMAIL_TEMPLATE = `
{userName} encountered {error} in {resolverName}
`

const errorReported: TemplateResolver = async (
  { userId, emailSubject, error, resolverName },
  context
) => {
  const { modules } = context;
  const user = await modules.users.findUserById(userId);  

  return [
    {
      type: "EMAIL",
      retries: 0,
      input: {
        from: user.contact.emailAddress,
        to: "support@dshop.local",
        replyTo: user.contact.emailAddress,
        subject: emailSubject || 'Error occurred',
        text: modules.messaging.renderToText(ERROR_EMAIL_TEMPLATE,
          {
            userName: `${user.profile?.address?.firstName} ${user.profile?.address?.lastName}`
            error,
            resolverName,
          }
        ),
      },
    },
  ];
};

```

## Register email template into Messaging director


```typescript
import { MessagingDirector } from "@unchainedshop/core-messaging";

MessagingDirector.registerTemplate("ERROR_REPORT", errorReported);
```

## Trigger message

Triggering the message is done by adding a work in the work queue and is treated like any other work, you simple specify the work type as `MESSAGE` and the template you want to use for the message as input to the work.

```typescript
const someResolver =  async (root, params, context: AppContext) => {
  const { modules, userId, countryContext } = context;

  await modules.worker.addWork(
    {
      type: "MESSAGE",
      retries: 0,
      input: {
        template: "ERROR_REPORT",
        userId,
        error: 'Required more information',
        resolverName: 'someResolver'
        ...params,
      },
    },
    userId
  );
  return true;
};
```

If you want to override the existing template with your own custom template, follow the steps above and register the template using the same name as the message type you want to override. 
Look into [MessageTypes](https://docs.unchained.shop/types/enums/platform.MessageTypes.html) definition to see all the built in message template name used in the engine.