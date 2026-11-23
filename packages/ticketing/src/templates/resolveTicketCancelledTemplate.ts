import type { TemplateResolver } from '@unchainedshop/core';
import { getTicketEventDetails } from '../event-details.ts';
import { findPurchaseRecipient, formatCredit } from '../ticket-details.ts';

export const resolveTicketCancelledTemplate: TemplateResolver<{
  tokenId: string;
  userId?: string;
  orderId?: string;
  discountCode?: string;
  discountAmount?: number;
  discountCurrencyCode?: string;
}> = async (
  { tokenId, userId, orderId, discountCode, discountAmount, discountCurrencyCode },
  { modules },
) => {
  const { EMAIL_FROM, EMAIL_WEBSITE_NAME = 'Unchained Shop', EMAIL_WEBSITE_URL } = process.env;
  const token = await modules.warehousing.findToken({ tokenId });
  if (!token) return [];

  const product = await modules.products.findProduct({ productId: token.productId });
  if (!product) return [];

  const { emailAddress: recipient, locale } = await findPurchaseRecipient(
    { orderId, userId },
    { modules },
  );
  if (!recipient) return [];

  const productText = await modules.products.texts.findLocalizedText({
    productId: token.productId,
    locale,
  });
  const eventTitle = productText?.title || 'Event';

  const { startsAt, location } = getTicketEventDetails(product);
  const slotText = startsAt
    ? startsAt.toLocaleString(locale.baseName, { dateStyle: 'medium', timeStyle: 'short' })
    : '';

  const eventDetails = [slotText, location].filter(Boolean).join(' at ');

  let text = `Hello

Your ticket for "${eventTitle}"${eventDetails ? ` (${eventDetails})` : ''} has been cancelled.`;

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

If you have any questions, please don't hesitate to contact us.

${EMAIL_WEBSITE_NAME}${EMAIL_WEBSITE_URL ? `\n${EMAIL_WEBSITE_URL}` : ''}
`;

  return [
    {
      type: 'EMAIL',
      input: {
        from: `${EMAIL_WEBSITE_NAME} <${EMAIL_FROM || 'noreply@unchained.local'}>`,
        to: recipient,
        subject: `${eventTitle}: Ticket Cancelled`,
        text,
      },
    },
  ];
};
