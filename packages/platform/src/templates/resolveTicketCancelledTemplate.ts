import type { TemplateResolver } from '@unchainedshop/core';

const { EMAIL_FROM, EMAIL_WEBSITE_NAME = 'Unchained Shop', EMAIL_WEBSITE_URL } = process.env;

export const resolveTicketCancelledTemplate: TemplateResolver<{
  tokenId: string;
  userId: string;
  discountCode?: string;
  discountAmount?: number;
}> = async ({ tokenId, userId, discountCode, discountAmount }, { modules }) => {
  const user = await modules.users.findUserById(userId);
  if (!user) return [];

  const token = await modules.warehousing.findToken({ tokenId });
  if (!token) return [];

  const product = await modules.products.findProduct({ productId: token.productId });
  if (!product) return [];

  const recipient =
    user.lastContact?.emailAddress || modules.users.primaryEmail(user)?.address;
  if (!recipient) return [];

  const locale = modules.users.userLocale(user);
  const productText = await modules.products.texts.findLocalizedText({
    productId: token.productId,
    locale,
  });
  const eventTitle = productText?.title || 'Event';

  const slot = (product as any).tokenization?.ercMetadataProperties?.slot || product.meta?.slot;
  const slotText = slot
    ? new Date(slot).toLocaleString(locale.baseName, { dateStyle: 'medium', timeStyle: 'short' })
    : '';

  const location = product.meta?.location || '';

  const eventDetails = [slotText, location].filter(Boolean).join(' at ');

  let text = `Hello

Your ticket for "${eventTitle}"${eventDetails ? ` (${eventDetails})` : ''} has been cancelled.`;

  if (discountCode && discountAmount) {
    text += `

As compensation, you have received a discount code worth ${(discountAmount / 100).toFixed(2)}:

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
