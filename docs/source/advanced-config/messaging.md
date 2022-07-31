---
title: "Messaging plugins"
description: Customize messaging 
---


```typescript
const errorReported: TemplateResolver = async (
  { userId, orderId, orderNumber, reason, phoneNumber, emailAddress },
  context: AppContext
) => {
  const { modules } = context;
  const user = await modules.users.findUserById(userId);
  const orderNumberShort = getModuloOrderNumber(orderNumber);
  

  return [
    {
      type: "EMAIL",
      retries: 0,
      input: {
        from: "noreply@dshop.local",
        to: "support@dshop.local",
        replyTo: process.env.EMAIL_TO || emailAddress,
        subject: `Email subject`,
        text: modules.messaging.renderToText(``,
          {
            subject: "",
            orderNumber,
            orderId,
            orderNumberShort,
            user,
            reason,
            phoneNumber,
            emailAddress,
          }
        ),
      },
    },
  ];
};

```


```typescript
MessagingDirector.registerTemplate("ERROR_REPORT", errorReported);
```


```typescript
export default async (root, params, context: AppContext) => {
  const { modules, userId, countryContext } = context;

  await modules.worker.addWork(
    {
      type: "MESSAGE",
      retries: 0,
      input: {
        template: "ERROR_REPORT",
        userId,
        country: countryContext,
        ...params,
      },
    },
    userId
  );
  return true;
};
```