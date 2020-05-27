import { MessagingDirector } from 'meteor/unchained:core-messaging';
import { Orders } from 'meteor/unchained:core-orders';

const {
  EMAIL_FROM,
  EMAIL_WEBSITE_NAME = 'Unchained Webshop',
  EMAIL_WEBSITE_URL,
  UI_ENDPOINT,
} = process.env;

const mjmlTemplate = `
<mjml>
  <mj-body background-color="#FAFAFA">
      <mj-section padding-bottom="32px" background-color="#FFFFFF">
        <mj-column width="100%">
          <mj-text font-size="20px" color="#232323" font-family="Helvetica Neue" font-weight="400">
            <h2>{{subject}}</h2>
          </mj-text>
          <mj-text font-size="20px" color="#232323" font-family="Helvetica Neue">
            <p>{{thankyou}} <a style="color:#2CAADF" href="{{shopUrl}}">{{shopName}}</a></p>
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
  {{thankyou}}\n
  \n
  -----------------\n
  {{buttonText}}: {{url}}\n
  -----------------\n
`;

const texts = {
  en: {
    buttonText: 'Follow purchase order status',
    thankyou: 'Thank you for your order on',
    subject: `${EMAIL_WEBSITE_NAME}: Order confirmation`,
  },
  de: {
    buttonText: 'Bestellstatus verfolgen',
    thankyou: 'Vielen Dank für deine Bestellung bei',
    subject: `${EMAIL_WEBSITE_NAME}: Bestellbestätigung`,
  },
  fr: {
    buttonText: 'Follow purchase order status',
    thankyou: 'Thank you for your order on',
    subject: `${EMAIL_WEBSITE_NAME}: Order confirmation`,
  },
};

export default ({ orderId, locale }) => {
  const order = Orders.findOne({ _id: orderId });
  const attachments = [];
  // TODO: If order.status is PENDING, we should only send the user
  // a notice that we have received the order but not confirming it
  const confirmation = order.document({ type: 'ORDER_CONFIRMATION' });
  if (confirmation) attachments.push(confirmation);
  if (order.payment().isBlockingOrderFullfillment()) {
    const invoice = order.document({ type: 'INVOICE' });
    if (invoice) attachments.push(invoice);
  } else {
    const receipt = order.document({ type: 'RECEIPT' });
    if (receipt) attachments.push(receipt);
  }
  const format = (price) => {
    const fixedPrice = price / 100;
    return `${order.currency} ${fixedPrice}`;
  };
  const { subject } = texts[locale.language];
  const templateVariables = {
    ...texts[locale.language],
    shopName: EMAIL_WEBSITE_NAME,
    shopUrl: EMAIL_WEBSITE_URL,
    subject,
    url: `${UI_ENDPOINT}/order?_id=${order._id}&otp=${order.orderNumber}`,
    summary: order.pricing().formattedSummary(format),
    positions: order.items().map((item) => {
      const productTexts = item.product().getLocalizedTexts(locale.normalized);
      const originalProductTexts = item
        .originalProduct()
        .getLocalizedTexts(locale.normalized);
      const product = productTexts && productTexts.title; // deprected
      const total = format(item.pricing().sum());
      const { quantity } = item;
      return {
        quantity,
        product,
        productTexts,
        originalProductTexts,
        total,
      };
    }),
  };
  return [
    {
      type: 'EMAIL',
      input: {
        from: EMAIL_FROM,
        to: order.contact.emailAddress,
        subject,
        text: MessagingDirector.renderToText(textTemplate, templateVariables),
        html: MessagingDirector.renderMjmlToHtml(
          mjmlTemplate,
          templateVariables
        ),
        attachments: attachments.map((file) => ({
          filename: `${order.orderNumber}_${file.name}`,
          path: file.path,
        })),
      },
    },
  ];
};
