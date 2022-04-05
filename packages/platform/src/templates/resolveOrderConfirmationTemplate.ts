import { TemplateResolver } from '@unchainedshop/types/messaging';
import { OrderPricingRowCategory } from '@unchainedshop/types/orders.pricing';
import { getOrderAttachmentsData } from './utils/getOrderAttachmentsData';
import { getOrderPositionsData } from './utils/getOrderPositionsData';

const { EMAIL_FROM, EMAIL_WEBSITE_NAME, EMAIL_WEBSITE_URL } = process.env;

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

export const resolveOrderConfirmationTemplate: TemplateResolver = async (
  { orderId, locale },
  context,
) => {
  const { modules } = context;
  const order = await modules.orders.findOrder({ orderId });

  if (order.status === 'PENDING') {
    return [];
  }

  const formatPrice = (price: number) => {
    const fixedPrice = price / 100;
    return `${order.currency} ${fixedPrice}`;
  };

  // TODO: If order.status is PENDING, we should only send the user
  // a notice that we have received the order but not confirming it
  const attachments = await getOrderAttachmentsData(order, { fileType: 'ORDER_CONFIRMATION' }, context);

  const orderPricing = modules.orders.pricingSheet(order);

  const { subject } = texts[locale.language];

  const data = {
    ...texts[locale.language],
    shopName: EMAIL_WEBSITE_NAME,
    shopUrl: EMAIL_WEBSITE_URL,
    subject,
    url: `${EMAIL_WEBSITE_URL}/order?_id=${order._id}`,
    summary: {
      items: formatPrice(
        orderPricing.total({
          category: OrderPricingRowCategory.Items,
          useNetPrice: false,
        }).amount,
      ),
      taxes: formatPrice(
        orderPricing.total({
          category: OrderPricingRowCategory.Taxes,
          useNetPrice: false,
        }).amount,
      ),
      delivery: formatPrice(
        orderPricing.total({
          category: OrderPricingRowCategory.Delivery,
          useNetPrice: false,
        }).amount,
      ),
      payment: formatPrice(
        orderPricing.total({
          category: OrderPricingRowCategory.Payment,
          useNetPrice: false,
        }).amount,
      ),
      gross: formatPrice(orderPricing.total({ useNetPrice: false }).amount),
    },
    positions: getOrderPositionsData(order, { locale }, context),
  };
  return [
    {
      type: 'EMAIL',
      input: {
        from: EMAIL_FROM || 'orders@unchained.local',
        to: order.contact.emailAddress,
        subject,
        text: modules.messaging.renderToText(textTemplate, data),
        html: modules.messaging.renderMjmlToHtml(mjmlTemplate, data),
        attachments,
      },
    },
  ];
};
