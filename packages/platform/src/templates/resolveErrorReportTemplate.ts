import { TemplateResolver } from '@unchainedshop/types/messaging.js';
import formatWorkItems from './utils/formatWorkItems.js';

const {
  EMAIL_FROM = 'noreply@unchained.local',
  EMAIL_ERROR_REPORT_RECIPIENT = 'support@unchained.local',
  EMAIL_WEBSITE_NAME = 'Unchained',
  ROOT_URL,
} = process.env;

const textTemplate = `
-------------------------
Unchained Endpoint: {{endpoint}}
Shop Name: {{name}}
-------------------------

{{content}}
`;

const resolveErrorReportTemplate: TemplateResolver = async ({ workItems }, context) => {
  const { modules } = context;

  return [
    {
      type: 'EMAIL',
      input: {
        from: EMAIL_FROM || 'noreply@unchained.local',
        to: EMAIL_ERROR_REPORT_RECIPIENT,
        subject: `${EMAIL_WEBSITE_NAME}: Queue Errors`,
        text: modules.messaging.renderToText(textTemplate, {
          endpoint: ROOT_URL,
          content: formatWorkItems(workItems),
          name: EMAIL_WEBSITE_NAME,
        }),
      },
    },
  ];
};

export { resolveErrorReportTemplate };

export default resolveErrorReportTemplate;
