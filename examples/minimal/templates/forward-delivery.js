import { MessagingDirector } from 'meteor/unchained:core-messaging';
import { Orders } from 'meteor/unchained:core-orders';
import moment from 'moment';

const { EMAIL_FROM, EMAIL_WEBSITE_NAME } = process.env;

const mjmlTemplate = `
<mjml>
  <mj-body background-color="#FAFAFA">
      <mj-section padding-bottom="32px" background-color="#fcfcfc">
        <mj-column width="100%">
          <mj-text align="center" font-size="20px" color="#232323" font-family="Helvetica Neue" font-weight="200">
            <h2 >{{shopName}}: Neue Bestellung</h2>
          </mj-text>
          <mj-text align="left" font-size="20px" color="#232323" font-family="Helvetica Neue" font-weight="200">
            <span>Bestellnummer: {{orderNumber}}</span><br/>
            <span>Bestelldatum: {{orderDate}}</span>
          </mj-text>
          <mj-text align="left" font-size="20px" color="#232323">Lieferadresse</mj-text>
          <mj-text align="left">
            {{address.firstName}} {{address.lastName}}<br/>
            {{address.company}}<br/>
            {{address.addressLine}}<br/>
            {{address.addressLine2}}<br/>
            {{address.postalCode}} {{address.city}} {{address.regionCode}}<br/>
            {{address.countryCode}}<br/>
          </mj-text>
          <mj-divider border-width="1px" border-style="dashed" border-color="lightgrey" />
          <mj-text align="left" font-size="20px" color="#232323">Produkte</mj-text>
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
  Bestellnummer: {{orderNumber}}\n
  Bestelldatum: {{orderDate}}\n
  \n
  Lieferadresse:\n
  -----------------\n
  {{address.firstName}} {{address.lastName}}\n
  {{address.company}}\n
  {{address.addressLine}}\n
  {{address.addressLine2}}\n
  {{address.postalCode}} {{address.city}}\n
  {{address.regionCode}}\n
  {{address.countryCode}}\n
  \n
  Produkte:\n
  -----------------\n
  {{#items}}
  * {{sku}} - {{name}}      CHF {{price}}     {{quantity}}\n
  {{/items}}
`;

MessagingDirector.configureTemplate(
  'DELIVERY',
  ({ orderId, transactionContext, config }) => {
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
        name: productTexts.title,
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

    const templateVariables = {
      mailPrefix: `${order.orderNumber}_`,
      items,
      contact: order.contact || {},
      total: order.pricing()?.total()?.amount / 100,
      shopName: EMAIL_WEBSITE_NAME,
      orderNumber: order.orderNumber,
      orderDate,
      ...configObject,
      address,
    };

    return [
      {
        type: 'EMAIL',
        input: {
          from: EMAIL_FROM,
          to: order.contact.emailAddress,
          subject: `${EMAIL_WEBSITE_NAME}: Neue Bestellung / ${order.orderNumber}`,
          text: MessagingDirector.renderToText(textTemplate, templateVariables),
          html: MessagingDirector.renderMjmlToHtml(
            mjmlTemplate,
            templateVariables
          ),
          attachments,
        },
      },
    ];
  }
);
