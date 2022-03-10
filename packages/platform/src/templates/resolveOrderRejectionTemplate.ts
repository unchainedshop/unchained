import { TemplateResolver } from '@unchainedshop/types/messaging';

const { EMAIL_FROM, EMAIL_WEBSITE_NAME = 'Unchained Webshop', UI_ENDPOINT } = process.env;

const mjmlTemplate = `
<mjml>
  <mj-body background-color="#FAFAFA">
      <mj-section padding-bottom="32px" background-color="#FFFFFF">
        <mj-column width="100%">
          <mj-text font-size="20px" color="#232323" font-family="Helvetica Neue" font-weight="400">
            <h2>{{subject}}</h2>
          </mj-text>
          <mj-text font-size="20px" color="#232323" font-family="Helvetica Neue">
            <p>{{rejection}}</p>
          </mj-text>
        </mj-column>
      </mj-section>

      <mj-section padding-bottom="20px" background-color="#F3F3F3">
        <mj-column>
          <mj-button href="{{url}}" font-family="Helvetica" background-color="#31302E" color="#FFFFFF">
           {{buttonText}}
         </mj-button>
        </mj-column>
      </mj-section>
  </mj-body>
</mjml>
`;

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
    url: `${UI_ENDPOINT}/order?_id=${order._id}`,
  };
  return [
    {
      type: 'EMAIL',
      input: {
        from: EMAIL_FROM,
        to: order.contact.emailAddress,
        subject,
        text: modules.messaging.renderToText(textTemplate, data),
        html: modules.messaging.renderMjmlToHtml(mjmlTemplate, data),
      },
    },
  ];
};
