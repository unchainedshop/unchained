import type { EmailTemplateType, UnchainedCore } from '@unchainedshop/core';
import type { Order } from '@unchainedshop/core-orders';
import { transformOrderToText } from './order-parser/index.ts';

const { EMAIL_FROM, EMAIL_WEBSITE_NAME, EMAIL_WEBSITE_URL } = process.env;

export async function orderEmail(
  order: Order,
  locale: Intl.Locale,
  context: UnchainedCore,
  { from, text, ...envelope }: Omit<EmailTemplateType['input'], 'from'> & { from?: string },
): Promise<EmailTemplateType[]> {
  const details = await transformOrderToText({ order, locale }, context);
  return [
    {
      type: 'EMAIL',
      input: {
        ...envelope,
        from: `${EMAIL_WEBSITE_NAME} <${from || EMAIL_FROM || 'noreply@unchained.local'}>`,
        text: `
${text}

${details}

${EMAIL_WEBSITE_NAME}: ${EMAIL_WEBSITE_URL}
`,
      },
    },
  ];
}
