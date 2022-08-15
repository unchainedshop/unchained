import { TemplateResolver } from '@unchainedshop/types/messaging';
import { systemLocale } from '@unchainedshop/utils';
import { getOrderAttachmentsData } from './utils/getOrderAttachmentsData';
import { getOrderPositionsData } from './utils/getOrderPositionsData';

const { EMAIL_FROM, EMAIL_WEBSITE_NAME, ROOT_URL } = process.env;

const mjmlTemplate = `
<mjml>
  <mj-body background-color="#FAFAFA">
      <mj-section padding-bottom="32px" background-color="#fcfcfc">
        <mj-column width="100%">
          <mj-text align="center" font-size="20px" color="#232323" font-family="Helvetica Neue" font-weight="200">
            <h2 >{{subject}}</h2>
          </mj-text>
          <mj-text align="left" font-size="20px" color="#232323" font-family="Helvetica Neue" font-weight="200">
            <span>Order number: {{orderNumber}}</span><br/>
            <span>Order date: {{orderDate}}</span>
            <a href="{{adminUILink}}">{{adminUILink}}</a>
          </mj-text>
          <mj-text align="left" font-size="20px" color="#232323">Delivery address</mj-text>
          <mj-text align="left">
            {{address.firstName}} {{address.lastName}}<br/>
            {{address.company}}<br/>
            {{address.addressLine}}<br/>
            {{address.addressLine2}}<br/>
            {{address.postalCode}} {{address.city}} {{address.regionCode}}<br/>
            {{address.countryCode}}<br/>
          </mj-text>
          <mj-divider border-width="1px" border-style="dashed" border-color="lightgrey" />
          <mj-text align="left" font-size="20px" color="#232323">Articles</mj-text>
          <mj-table>
            <tr style="border-bottom:1px solid #ecedee;text-align:left;padding:15px 0;">
              <th style="padding: 0 15px 0 0;">Article</th>
              <th style="padding: 0 15px;">Quantity</th>
            </tr>
            {{#items}}
              <tr>
                <td style="padding: 0 15px 0 0;">{{sku}} - {{name}}</td>
                <td style="padding: 0 15px;">{{quantity}}</td>
              </tr>
            {{/items}}
          </mj-table>
        </mj-column>
      </mj-section>
  </mj-body>
</mjml>
`;

const textTemplate = `
  {{subject}}\n
  \n
  Order number: {{orderNumber}}\n
  Order date: {{orderDate}}\n
  Link: {{adminUILink}}\n
  \n
  Delivery address:\n
  -----------------\n
  {{address.firstName}} {{address.lastName}}\n
  {{address.company}}\n
  {{address.addressLine}}\n
  {{address.addressLine2}}\n
  {{address.postalCode}} {{address.city}}\n
  {{address.regionCode}}\n
  {{address.countryCode}}\n
  \n
  Articles:\n
  -----------------\n
  {{#items}}
  * {{sku}} - {{name}}      CHF {{price}}     {{quantity}}\n
  {{/items}}
`;

export const resolveForwardDeliveryTemplate: TemplateResolver = async ({ config, orderId }, context) => {
  const { modules } = context;
  const order = await modules.orders.findOrder({ orderId });
  const orderPricing = modules.orders.pricingSheet(order);

  const orderDate = new Date(order.ordered).toLocaleString();

  const attachments = await getOrderAttachmentsData(order, { fileType: 'DELIVERY_NOTE' }, context);

  const address = order.billingAddress;
  const configObject = config.reduce((acc, { key, value }) => {
    return {
      ...acc,
      [key]: value,
    };
  }, {});

  const subject = `${EMAIL_WEBSITE_NAME}: New Order / ${order.orderNumber}`;

  const adminUILink = `${ROOT_URL}/orders/view/?_id=${order._id}`;

  const data = {
    contact: order.contact || {},
    adminUILink,
    items: getOrderPositionsData(order, { locale: systemLocale }, context),
    orderDate,
    orderNumber: order.orderNumber,
    shopName: EMAIL_WEBSITE_NAME,
    subject,
    total: orderPricing.total({ useNetPrice: false }).amount / 100,
    ...configObject,
    address,
  };

  return [
    {
      type: 'EMAIL',
      input: {
        from: configObject.from || EMAIL_FROM || 'noreply@unchained.local',
        to: configObject.to || 'orders@unchained.local',
        cc: configObject.cc,
        subject,
        text: modules.messaging.renderToText(textTemplate, data),
        html: modules.messaging.renderMjmlToHtml(mjmlTemplate, data),
        attachments,
      },
    },
  ];
};
