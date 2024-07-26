import { TemplateResolver } from '@unchainedshop/core-messaging';

const { EMAIL_FROM, EMAIL_WEBSITE_NAME, EMAIL_WEBSITE_URL } = process.env;

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
  { modules },
) => {
  const quotation = await modules.quotations.findQuotation({ quotationId });
  const user = await modules.users.findUserById(quotation.userId);
  const attachments = (
    await modules.files.findFiles(
      { 'meta.quotationId': quotation._id, 'meta.type': 'PROPOSAL' },
      { sort: { 'meta.date': -1 } },
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
    url: `${EMAIL_WEBSITE_URL}/quotation?_id=${quotation._id}`,
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
