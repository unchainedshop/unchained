import { MessagingDirector } from 'meteor/unchained:core-messaging';
import { Orders } from 'meteor/unchained:core-orders';
import moment from 'moment';

const {
  EMAIL_FROM,
  EMAIL_WEBSITE_NAME = 'Unchained Webshop',
  ROOT_URL,
} = process.env;

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
            <a href="{{controlpanelLink}}">{{controlpanelLink}}</a>
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
  Link: {{controlpanelLink}}\n
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

export default ({ orderId, transactionContext, config }) => {
  const order = Orders.findOne({ _id: orderId });

  const momentDate = moment(order.ordered);
  momentDate.locale('de-CH');
  const orderDate = momentDate.format('lll');

  const attachments = [];
  const deliveryNote = order.document({ type: 'DELIVERY_NOTE' });
  if (deliveryNote) attachments.push(deliveryNote);
  if (order.payment().isBlockingOrderFullfillment()) {
    const invoice = order.document({ type: 'INVOICE' });
    if (invoice) attachments.push(invoice);
  } else {
    const receipt = order.document({ type: 'RECEIPT' });
    if (receipt) attachments.push(receipt);
  }

  const items = order.items().map((position) => {
    const product = position.product();
    const originalProduct = position.originalProduct();
    const productTexts = product.getLocalizedTexts();
    const originalProductTexts = originalProduct.getLocalizedTexts();
    const pricing = position.pricing();
    const unitPrice = pricing.unitPrice();
    return {
      sku: product.warehousing && product.warehousing.sku,
      productTexts,
      originalProductTexts,
      name: productTexts?.title,
      price: unitPrice?.amount ?? unitPrice.amount / 100,
      quantity: position.quantity,
    };
  });

  const address = transactionContext?.address || order.billingAddress;
  const configObject = config.reduce((acc, { key, value }) => {
    return {
      ...acc,
      [key]: value,
    };
  }, {});

  const subject = `${EMAIL_WEBSITE_NAME}: New Order / ${order.orderNumber}`;

  const controlpanelLink = `${ROOT_URL}/orders/view/?_id=${order._id}`;

  const templateVariables = {
    subject,
    items,
    contact: order.contact || {},
    total: order.pricing()?.total()?.amount / 100,
    shopName: EMAIL_WEBSITE_NAME,
    orderNumber: order.orderNumber,
    orderDate,
    controlpanelLink,
    ...configObject,
    address,
  };

  return [
    {
      type: 'EMAIL',
      input: {
        from: configObject.from || EMAIL_FROM,
        to: configObject.to,
        cc: configObject.cc,
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
