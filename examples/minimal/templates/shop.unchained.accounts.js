const mjmlTemplate = `
<mjml>
  <mj-body background-color="#FAFAFA">
      <mj-section padding-bottom="32px" background-color="#fcfcfc">
        <mj-column width="100%">
          <mj-text align="center" font-size="20px" color="#232323" font-family="Helvetica Neue" font-weight="200">
            <h2>{{meta.subject}}</h2>
          </mj-text>
          <mj-text align="left" font-size="20px" color="#232323" font-family="Helvetica Neue" font-weight="200">
            <span>{{meta.message}}</span><br/>
          </mj-text>
        </mj-column>
      </mj-section>

      <mj-section padding-bottom="20px" background-color="#f3f3f3">
        <mj-column>
          <mj-button href="{{meta.url}}" font-family="Helvetica" background-color="#31302E" color="white">
           {{meta.buttonText}}
         </mj-button>
         <mj-spacer/>
        </mj-column>
      </mj-section>
  </mj-body>
</mjml>
`;

const {
  EMAIL_FROM,
} = process.env;

const textTemplate = `
  {{meta.message}}
  \n
  -----------------\n
  {{meta.buttonText}}: {{meta.url}}\n
  -----------------\n
`;

export default texts => (meta, { locale, ...context }, { renderToText, renderMjmlToHtml }) => {
  const langCode = locale.substr(0, 2).toLowerCase();
  return {
    from: from => from || EMAIL_FROM,
    subject: () => texts[langCode].subject,
    text: () => renderToText(textTemplate, {
      meta: {
        ...texts[langCode],
        ...meta,
      },
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
