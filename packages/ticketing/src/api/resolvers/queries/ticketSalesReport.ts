import { log } from '@unchainedshop/logger';
import type { Context } from '@unchainedshop/api';
import { buildTicketSalesReport } from '../../../sales-report.ts';

export default async function ticketSalesReport(
  root: never,
  { from, to, forceLocale }: { from: Date; to: Date; forceLocale?: string },
  context: Context,
) {
  log('query ticketSalesReport', { userId: context.userId, from, to });
  return buildTicketSalesReport(context, {
    from,
    to,
    locale: forceLocale ? new Intl.Locale(forceLocale) : context.locale,
  });
}
