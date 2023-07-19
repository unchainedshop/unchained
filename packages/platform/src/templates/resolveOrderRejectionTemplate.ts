import { TemplateResolver } from '@unchainedshop/types/messaging.js';

const { EMAIL_FROM, EMAIL_WEBSITE_NAME, EMAIL_WEBSITE_URL } = process.env;

const textTemplate = `
  {{subject}}\n
  \n
  {{rejection}}\n
  \n
  -----------------\n
  {{buttonText}}: {{url}}\n
  -----------------\n
`;

const texts = {
  en: {
    buttonText: 'Details are available at',
    rejection: 'Your order was cancelled.',
    subject: `${EMAIL_WEBSITE_NAME}: Order cancelled`,
  },
  de: {
    buttonText: 'Details abrufen',
    rejection: 'Deine Bestellung wurde storniert',
    subject: `${EMAIL_WEBSITE_NAME}: Bestellung storniert`,
  },
  fr: {
    buttonText: 'Details are available at',
    rejection: 'Your order was cancelled.',
    subject: `${EMAIL_WEBSITE_NAME}: Order cancelled`,
  },
};

export const resolveOrderRejectionTemplate: TemplateResolver = async ({ orderId, locale }, context) => {
  const { modules } = context;
  const order = await modules.orders.findOrder({ orderId });

  if (order.status !== 'REJECTED') {
    return [];
  }

  const { subject } = texts[locale.language];

  const data = {
    ...texts[locale.language],
    subject,
    url: `${EMAIL_WEBSITE_URL}/order?_id=${order._id}`,
  };
  return [
    {
      type: 'EMAIL',
      input: {
        from: EMAIL_FROM || 'orders@unchained.local',
        to: order.contact.emailAddress,
        subject,
        text: modules.messaging.renderToText(textTemplate, data),
      },
    },
  ];
};
