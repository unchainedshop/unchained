import type { TemplateResolver } from '@unchainedshop/core';
import { getTicketEventDetails } from '../event-details.ts';
import { findPurchaseRecipient } from '../ticket-details.ts';

export const resolveEventCancelledTemplate: TemplateResolver<{
  productId: string;
  userId?: string;
  orderId?: string;
  discountCode?: string;
  discountAmount?: number;
}> = async ({ productId, userId, orderId, discountCode, discountAmount }, { modules }) => {
  const { EMAIL_FROM, EMAIL_WEBSITE_NAME = 'Unchained Shop', EMAIL_WEBSITE_URL } = process.env;
  const product = await modules.products.findProduct({ productId });
  if (!product) return [];

  const { emailAddress: recipient, locale } = await findPurchaseRecipient(
    { orderId, userId },
    { modules },
  );
  if (!recipient) return [];

  const productText = await modules.products.texts.findLocalizedText({
    productId,
    locale,
  });
  const eventTitle = productText?.title || 'Event';

  const { startsAt, location } = getTicketEventDetails(product);
  const slotText = startsAt
    ? startsAt.toLocaleString(locale.baseName, { dateStyle: 'medium', timeStyle: 'short' })
    : '';

  const eventDetails = [slotText, location].filter(Boolean).join(' at ');

  let text = `Hello

We regret to inform you that the event "${eventTitle}"${eventDetails ? ` (${eventDetails})` : ''} has been cancelled.`;

  if (discountCode && discountAmount) {
    text += `

As compensation, you have received a discount code worth ${(discountAmount / 100).toFixed(2)}:

  ${discountCode}

You can use this code for future purchases.`;
  }

  text += `

We apologize for the inconvenience.

${EMAIL_WEBSITE_NAME}${EMAIL_WEBSITE_URL ? `\n${EMAIL_WEBSITE_URL}` : ''}
`;

  return [
    {
      type: 'EMAIL',
      input: {
        from: `${EMAIL_WEBSITE_NAME} <${EMAIL_FROM || 'noreply@unchained.local'}>`,
        to: recipient,
        subject: `${eventTitle}: Event Cancelled`,
        text,
      },
    },
  ];
};
