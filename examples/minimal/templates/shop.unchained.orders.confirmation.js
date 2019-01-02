const mjmlTemplate = `
<mjml>
  <mj-body background-color="#FAFAFA">
      <mj-section padding-bottom="32px" background-color="#FFFFFF">
        <mj-column width="100%">
          <mj-text font-size="20px" color="#232323" font-family="Helvetica Neue" font-weight="400">
            <h2>{{meta.subject}}</h2>
          </mj-text>
          <mj-text font-size="20px" color="#232323" font-family="Helvetica Neue">
            <p>{{meta.thankyou}} <a style="color:#2CAADF" href="{{shopUrl}}">{{shopName}}</a></p>
          </mj-text>
        </mj-column>
      </mj-section>

      <mj-section padding-bottom="20px" background-color="#F3F3F3">
        <mj-column>
          <mj-button href="{{meta.url}}" font-family="Helvetica" background-color="#31302E" color="#FFFFFF">
           {{meta.buttonText}}
         </mj-button>
        </mj-column>
      </mj-section>
  </mj-body>
</mjml>
`;

const {
  EMAIL_FROM,
  EMAIL_WEBSITE_NAME,
  EMAIL_WEBSITE_URL,
} = process.env;

const textTemplate = `
  {{meta.thankyou}} {{shopName}}\n
  \n
  -----------------\n
  {{meta.buttonText}}: {{meta.url}}\n
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

export default (meta, { locale, ...context }, { renderToText, renderMjmlToHtml }) => {
  const langCode = locale.substr(0, 2).toLowerCase();
  return {
    to: to => to || 'admin@localhost',
    from: from => from || EMAIL_FROM,
    subject: () => texts[langCode].subject,
    text: () => renderToText(textTemplate, {
      meta: {
        ...texts[langCode],
        ...meta,
      },
      shopName: EMAIL_WEBSITE_NAME,
      shopUrl: EMAIL_WEBSITE_URL,
      context,
    }),
    html: () => renderMjmlToHtml(mjmlTemplate, {
      meta: {
        ...texts[langCode],
        ...meta,
      },
      context,
    }),
  };
};
