import type { TemplateResolver } from '@unchainedshop/core';
import { getTicketEventDetails } from '../event-details.ts';
import { findPurchaseRecipient, formatCredit } from '../ticket-details.ts';

export const resolveEventCancelledTemplate: TemplateResolver<{
  productId: string;
  userId?: string;
  orderId?: string;
  discountCode?: string;
  discountAmount?: number;
  discountCurrencyCode?: string;
}> = async (
  { productId, userId, orderId, discountCode, discountAmount, discountCurrencyCode },
  { modules },
) => {
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
    const worth = await formatCredit(
      { amount: discountAmount, currencyCode: discountCurrencyCode, locale },
      { modules },
    );
    text += `

As compensation, you have received a discount code worth ${worth}:

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
