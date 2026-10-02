import type { TemplateResolver } from '@unchainedshop/core';
import type { TicketSalesReportMessagePayload } from '../sales-report-worker.ts';
import { toDecimalAmount } from '../sales-report-csv.ts';

const csvAttachment = (filename: string, csv: string) => ({
  filename,
  // The byte order mark makes spreadsheets read the file as UTF-8
  content: Buffer.from(`\uFEFF${csv}`, 'utf8').toString('base64'),
  contentType: 'text/csv; charset=utf-8',
  encoding: 'base64',
});

export const resolveTicketSalesReportTemplate: TemplateResolver<
  TicketSalesReportMessagePayload
> = async ({ from, to, recipients, totals, csv }) => {
  const { EMAIL_FROM, EMAIL_WEBSITE_NAME = 'Unchained Shop' } = process.env;
  if (!recipients?.length) return [];

  const period = `${new Date(from).toISOString()} – ${new Date(to).toISOString()}`;
  const day = new Date(from).toISOString().slice(0, 10);
  const lines = totals.map(
    ({ currencyCode, orders, tickets, total }) =>
      `${currencyCode}: ${orders} orders, ${tickets} tickets, ${toDecimalAmount(total, currencyCode)} ${currencyCode}`,
  );

  return [
    {
      type: 'EMAIL',
      input: {
        from: `${EMAIL_WEBSITE_NAME} <${EMAIL_FROM || 'noreply@unchained.local'}>`,
        to: recipients.join(', '),
        subject: `${EMAIL_WEBSITE_NAME}: ticket sales ${day}`,
        text: `Ticket sales ${period}

${lines.join('\n')}

The orders, performances and payment providers are attached as CSV files.
`,
        attachments: [
          csvAttachment(`ticket-sales-orders-${day}.csv`, csv.orders),
          csvAttachment(`ticket-sales-performances-${day}.csv`, csv.performances),
          csvAttachment(`ticket-sales-payment-providers-${day}.csv`, csv.paymentProviders),
        ],
      },
    },
  ];
};
