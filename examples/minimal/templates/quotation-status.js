import { MessagingDirector } from 'meteor/unchained:core-messaging';
import { Quotations } from 'meteor/unchained:core-quotations';

const { EMAIL_FROM, EMAIL_WEBSITE_NAME, UI_ENDPOINT } = process.env;

const textTemplate = `
  Anfrage: {{quotation.quotationNumber}}\n
  \n
  Status: {{quotation.status}}
  \n
  -----------------\n
  Anzeigen: {{url}}\n
  -----------------\n
`;

MessagingDirector.configureTemplate(
  'QUOTATION_STATUS',
  ({ quotationId, locale }) => {
    const quotation = Quotations.findOne({ _id: quotationId });
    const user = quotation.user();
    const attachments = [quotation.document({ type: 'PROPOSAL' })].filter(
      Boolean
    );

    const templateVariables = {
      mailPrefix: `${quotation.quotationNumber}_`,
      url: `${UI_ENDPOINT}/quotation?_id=${quotation._id}&otp=${
        quotation.quotationNumber || ''
      }`,
      quotation,
      locale,
    };

    return [
      {
        type: 'EMAIL',
        input: {
          from: EMAIL_FROM,
          to: user.primaryEmail()?.address,
          subject: `${EMAIL_WEBSITE_NAME}: Aktualisierter Offertenstatus / ${quotation.quotationNumber}`,
          text: MessagingDirector.renderToText(textTemplate, templateVariables),
          attachments,
        },
      },
    ];
  }
);
