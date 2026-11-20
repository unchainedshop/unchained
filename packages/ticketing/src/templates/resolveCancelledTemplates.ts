import type { MessageTemplateContext, TemplateResolver } from '@unchainedshop/core';
import { formatPrice } from '@unchainedshop/utils';
import { getTicketEventDetails } from '../event-details.ts';
import { findPurchaseRecipient } from '../ticket-details.ts';

export interface CancellationNotice {
  orderId?: string;
  userId?: string;
  discountCode?: string;
  discountAmount?: number;
  discountCurrencyCode?: string;
  discountCurrencyDecimals?: number;
}

async function cancellationEmail(
  kind: 'Event' | 'Ticket',
  productId: string,
  notice: CancellationNotice,
  { modules, getCurrencyDecimals }: MessageTemplateContext,
) {
  const product = await modules.products.findProduct({ productId });
  if (!product) return [];
  const { emailAddress, locale } = await findPurchaseRecipient(notice, { modules });
  if (!emailAddress) return [];

  const productText = await modules.products.texts.findLocalizedText({ productId, locale });
  const title = productText?.title || 'Event';
  const { startsAt, location } = getTicketEventDetails(product);
  const date = startsAt?.toLocaleString(locale.baseName, { dateStyle: 'medium', timeStyle: 'short' });
  const details = [date, location].filter(Boolean).join(' at ');
  const intro = kind === 'Event' ? 'We regret to inform you that the event' : 'Your ticket for';
  const paragraphs = [
    'Hello',
    `${intro} "${title}"${details ? ` (${details})` : ''} has been cancelled.`,
  ];

  const { discountCode, discountAmount, discountCurrencyCode: currencyCode } = notice;
  if (discountCode && discountAmount) {
    // Older queued messages have no credit currency, which can differ from the purchase currency.
    const credit = currencyCode
      ? formatPrice({
          amount: discountAmount,
          currencyCode,
          locale,
          decimals: notice.discountCurrencyDecimals ?? (await getCurrencyDecimals?.(currencyCode)) ?? 2,
        })
      : (discountAmount / 100).toFixed(2);
    paragraphs.push(
      `As compensation, you have received a discount code worth ${credit}:`,
      `  ${discountCode}`,
      'You can use this code for future purchases.',
    );
  }

  const { EMAIL_FROM, EMAIL_WEBSITE_NAME = 'Unchained Shop', EMAIL_WEBSITE_URL } = process.env;
  paragraphs.push(
    kind === 'Event'
      ? 'We apologize for the inconvenience.'
      : "If you have any questions, please don't hesitate to contact us.",
    `${EMAIL_WEBSITE_NAME}${EMAIL_WEBSITE_URL ? `\n${EMAIL_WEBSITE_URL}` : ''}\n`,
  );
  return [
    {
      type: 'EMAIL',
      input: {
        from: `${EMAIL_WEBSITE_NAME} <${EMAIL_FROM || 'noreply@unchained.local'}>`,
        to: emailAddress,
        subject: `${title}: ${kind} Cancelled`,
        text: paragraphs.join('\n\n'),
      },
    },
  ];
}

export const resolveEventCancelledTemplate: TemplateResolver<
  CancellationNotice & { productId: string }
> = (notice, api) => cancellationEmail('Event', notice.productId, notice, api);

export const resolveTicketCancelledTemplate: TemplateResolver<
  CancellationNotice & { tokenId: string }
> = async (notice, api) => {
  const token = await api.modules.warehousing.findToken({ tokenId: notice.tokenId });
  return token ? cancellationEmail('Ticket', token.productId, notice, api) : [];
};
