import { TemplateResolver } from '@unchainedshop/types/messaging';

const {
  EMAIL_FROM,
  EMAIL_WEBSITE_NAME = 'Unchained Webshop',
  UI_ENDPOINT,
} = process.env;

const textTemplate = `
  {{subject}}\n
  \n
  Status: {{quotation.status}}
  \n
  -----------------\n
  Show: {{url}}\n
  -----------------\n
`;

export const resolveQuotationStatusTemplate: TemplateResolver = async (
  { quotationId, locale },
  { modules }
) => {
  const quotation = await modules.quotations.findQuotation({ quotationId });
  const user = await modules.users.findUser({ userId: quotation.userId });
  const attachments = (
    await modules.files.findFilesByMetaData(
      { meta: { quotationId: quotation._id, type: 'PROPOSAL ' } },
      { sort: { 'meta.date': -1 } }
    )
  )
    .filter(Boolean)
    .map((file) => ({
      filename: `${quotation.quotationNumber}_${file.name}`,
      path: file.url,
    }));

  const subject = `${EMAIL_WEBSITE_NAME}: Updated Quotation / ${quotation.quotationNumber}`;
  
  const data = {
    locale,
    quotation,
    subject,
    url: `${UI_ENDPOINT}/quotation?_id=${quotation._id}`,
  };

  return [
    {
      type: 'EMAIL',
      input: {
        from: EMAIL_FROM,
        to: modules.users.primaryEmail(user)?.address,
        subject,
        text: modules.messaging.renderToText(textTemplate, data),
        attachments,
      },
    },
  ];
};
