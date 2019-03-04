import moment from "moment";

const mjmlTemplate = `
<mjml>
  <mj-body background-color="#FAFAFA">
      <mj-section padding-bottom="32px" background-color="#fcfcfc">
        <mj-column width="100%">
          <mj-text align="center" font-size="20px" color="#232323" font-family="Helvetica Neue" font-weight="200">
            <h2 >{{shopName}}: Neue Bestellung</h2>
          </mj-text>
          <mj-text align="left" font-size="20px" color="#232323" font-family="Helvetica Neue" font-weight="200">
            <span>Bestellnummer: {{context.order.orderNumber}}</span><br/>
            <span>Bestelldatum: {{orderDate}}</span>
          </mj-text>
          <mj-text align="left" font-size="20px" color="#232323">Lieferadresse</mj-text>
          <mj-text align="left">
            {{meta.firstName}} {{meta.lastName}}<br/>
            {{meta.company}}<br/>
            {{meta.addressLine}}<br/>
            {{meta.addressLine2}}<br/>
            {{meta.postalCode}} {{meta.city}} {{meta.regionCode}}<br/>
            {{meta.countryCode}}<br/>
          </mj-text>
          <mj-divider border-width="1px" border-style="dashed" border-color="lightgrey" />
          <mj-text align="left" font-size="20px" color="#232323">Produkte</mj-text>
          <mj-table>
            <tr style="border-bottom:1px solid #ecedee;text-align:left;padding:15px 0;">
              <th style="padding: 0 15px 0 0;">Article</th>
              <th style="padding: 0 15px;">Quantity</th>
            </tr>
            {{#meta.items}}
              <tr>
                <td style="padding: 0 15px 0 0;">{{sku}} - {{name}}</td>
                <td style="padding: 0 15px;">{{quantity}}</td>
              </tr>
            {{/meta.items}}
          </mj-table>
        </mj-column>
      </mj-section>
  </mj-body>
</mjml>
`;

const { EMAIL_FROM, EMAIL_WEBSITE_NAME } = process.env;

const textTemplate = `
  Bestellnummer: {{context.order.orderNumber}}\n
  Bestelldatum: {{orderDate}}\n
  \n
  Lieferadresse:\n
  -----------------\n
  {{meta.firstName}} {{meta.lastName}}\n
  {{meta.company}}\n
  {{meta.addressLine}}\n
  {{meta.addressLine2}}\n
  {{meta.postalCode}} {{meta.city}}\n
  {{meta.regionCode}}\n
  {{meta.countryCode}}\n
  \n
  Produkte:\n
  -----------------\n
  {{#meta.items}}
  * {{sku}} - {{name}}      CHF {{price}}     {{quantity}}\n
  {{/meta.items}}
`;

export default (meta, context, { renderToText, renderMjmlToHtml }) => {
  const momentDate = moment(context.order.ordered);
  momentDate.locale("de-CH");
  const orderDate = momentDate.format("lll");
  return {
    to: to => to || "admin@localhost",
    from: from => from || EMAIL_FROM,
    subject: () =>
      `${EMAIL_WEBSITE_NAME}: Neue Bestellung / ${context.order.orderNumber}`,
    text: () =>
      renderToText(textTemplate, {
        meta,
        context,
        orderDate,
        shopName: EMAIL_WEBSITE_NAME
      }),
    html: () => renderMjmlToHtml(mjmlTemplate, { meta, context, orderDate })
  };
};
