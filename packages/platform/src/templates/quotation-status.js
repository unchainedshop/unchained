import { MessagingDirector } from 'meteor/unchained:core-messaging';
import { Quotations } from 'meteor/unchained:core-quotations';

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

export default ({ quotationId, locale }) => {
  const quotation = Quotations.findOne({ _id: quotationId });
  const user = quotation.user();
  const attachments = [quotation.document({ type: 'PROPOSAL' })]
    .filter(Boolean)
    .map((file) => ({
      filename: `${quotation.quotationNumber}_${file.name}`,
      path: file.path,
    }));

  const subject = `${EMAIL_WEBSITE_NAME}: Updated Quotation / ${quotation.quotationNumber}`;
  const templateVariables = {
    subject,
    url: `${UI_ENDPOINT}/quotation?_id=${quotation._id}`,
    quotation,
    locale,
  };

  return [
    {
      type: 'EMAIL',
      input: {
        from: EMAIL_FROM,
        to: user.primaryEmail()?.address,
        subject,
        text: MessagingDirector.renderToText(textTemplate, templateVariables),
        attachments,
      },
    },
  ];
};
