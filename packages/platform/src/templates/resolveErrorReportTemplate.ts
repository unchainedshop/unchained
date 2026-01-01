import type { TemplateResolver } from '@unchainedshop/core';
import { stringify } from 'safe-stable-stringify';

const {
  EMAIL_FROM = 'noreply@unchained.local',
  EMAIL_ERROR_REPORT_RECIPIENT = 'support@unchained.local',
  EMAIL_WEBSITE_NAME = 'Unchained',
} = process.env;

const formatWorkItems = (workItems) => {
  return workItems
    .map(({ _id, type, started, error }) => {
      const stringifiedErrors = stringify(error, null, 2);
      return `${new Date(started).toLocaleString()} ${type} (${_id}): ${stringifiedErrors}`;
    })
    .join('\n');
};

const resolveErrorReportTemplate: TemplateResolver = async ({ workItems }) => {
  const content = formatWorkItems(workItems);

  const text = `
-------------------------
Unchained Endpoint: ${process.env.ROOT_URL}
Shop Name: ${EMAIL_WEBSITE_NAME}
-------------------------

${content}
`;

  return [
    {
      type: 'EMAIL',
      input: {
        from: EMAIL_FROM || 'noreply@unchained.local',
        to: EMAIL_ERROR_REPORT_RECIPIENT,
        subject: `${EMAIL_WEBSITE_NAME}: Queue Errors`,
        text,
      },
    },
  ];
};

export { resolveErrorReportTemplate };

export default resolveErrorReportTemplate;
