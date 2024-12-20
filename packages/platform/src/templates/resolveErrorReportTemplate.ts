import { TemplateResolver } from '@unchainedshop/core';
import { stringify } from 'safe-stable-stringify';
import mustache from 'mustache';

const {
  EMAIL_FROM = 'noreply@unchained.local',
  EMAIL_ERROR_REPORT_RECIPIENT = 'support@unchained.local',
  EMAIL_WEBSITE_NAME = 'Unchained',
  ROOT_URL,
} = process.env;

const formatWorkItems = (workItems) => {
  return workItems
    .map(({ _id, type, started, error }) => {
      const stringifiedErrors = stringify(error, null, 2);
      return `${new Date(started).toLocaleString()} ${type} (${_id}): ${stringifiedErrors}`;
    })
    .join('\n');
};

const textTemplate = `
-------------------------
Unchained Endpoint: {{endpoint}}
Shop Name: {{name}}
-------------------------

{{content}}
`;

const resolveErrorReportTemplate: TemplateResolver = async ({ workItems }) => {
  const text = mustache.render(
    textTemplate,
    {
      endpoint: ROOT_URL,
      content: formatWorkItems(workItems),
      name: EMAIL_WEBSITE_NAME,
    },
    undefined,
    { escape: (t) => t },
  );

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
